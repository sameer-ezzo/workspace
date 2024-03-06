import { Injectable, OnDestroy } from "@angular/core";
import { ApiService } from "./api.service";
import { LocalService } from "./local.service";
import { Subscription, Subject, firstValueFrom } from "rxjs";
import { ConnectionService } from "./connection-service.service";
import { combineLatest } from "rxjs";
import { debounceTime, filter } from "rxjs/operators";
import { DataChange, DataEdit } from "./model";
import { Timer } from "./timer";
import { JsonPatch } from "@noah-ark/json-patch";
import { PathInfo } from '@noah-ark/path-matcher';


@Injectable({ providedIn: 'root' })
export class DataConflictStrategy {
    async overwrite(conflicts: DataEdit[]): Promise<{ edit: DataEdit, overwrite: boolean }[]> {
        return conflicts.map(edit => { return { edit, overwrite: true } });
    }
}


@Injectable({ providedIn: 'root' })
export class DataSyncService implements OnDestroy {

    private _sync$ = new Subject<boolean>();
    private _subscriptions: Subscription[] = [];
    private _refreshData$ = new Timer(1000 * 60 * 3)// start sync every 3 mins

    constructor(private api: ApiService,
        private local: LocalService,
        private conflictStrategy: DataConflictStrategy,
        private connection: ConnectionService) {



        const notifyConnection$ = this.connection.monitor().pipe(filter(online => online)); // start sync when connection is back
        const s1 = combineLatest([this._refreshData$, notifyConnection$]).subscribe(() => this.start(false));
        this._subscriptions.push(s1);

        //real sync start after debounceTime 300 ms to prevent calling sync job intensively 
        const s2 = this._sync$.pipe(debounceTime(300)).subscribe(reloadData => this._startSync(reloadData));
        this._subscriptions.push(s2);
    }

    ngOnDestroy(): void { this._subscriptions.forEach(s => s.unsubscribe()); } //clean up



    private _change$ = new Subject<DataChange>();
    change$ = this._change$.asObservable();

    private _fetchRequests: string[] = [];
    /**
     * Queue a fetch request for data sync job to process
     * @param path the data path
     * @param immediately wether or not to run the jub now
     */
    requestFetch(path: string, immediately = false): Promise<boolean> | null {
        this._fetchRequests.push(path);
        if (immediately) return this.start(false);
        return null
    }

    /**
     * Get data from api server, and refresh/cache local data, and notify listeners
     * @param path the data path
     */
    async fetch<T = any>(path: string): Promise<T> {
        // read data from api and update the local store
        const serverData = await  firstValueFrom(this.api.get<T>(path));
        this.local.set(path, serverData);
        //notify listeners
        //this.cache.notify(path, { data: serverData, source: { type: "api" } }); //todo why
        return serverData;
    }


    /**
     * Array wrapper for calling dataChange
     */
    async dataChanges(changes: DataChange[], notifyStreams = true): Promise<void> {
        const tasks = changes.map(change => this.dataChange(change, notifyStreams));
        await Promise.all(tasks); //todo handle error
    }

    /**
    * Apply change on local data through the following steps:
    * 1. Ensure that change order is as expected (lastChange + 1), if not exit and sync
    * 3. If there are local pending edits register conflicts (if any)
    *     * 2. Apply change on local store
    * 4. Notify related listeners of data streams 
    * @param change the data change object that represent the change
    * @param notifyStreams wether or not to notify listeners about the change
    */
    async dataChange(change: DataChange, notifyStreams = true): Promise<void> { //todo i think it's better to remove notifyStreams param
        const path = PathInfo.parse(change.path);
        const item = this.local.getLocalStorageItem(path.collection, path.id);

        //1- Check the change consistency
        if (change.lastChange > item.lastChange) { //changes must be applied in sequence to ensure consistency of the data (client is our of sync)
            await this.requestFetch(change.path);
            this.start(false);
            return;
        }
        item.lastChange = change.date;

        //2- Apply the change to original doc
        item.originalDoc = JsonPatch.patch(item.originalDoc || {}, change.patches);
        item.editedDoc = JSON.parse(JSON.stringify(item.originalDoc));


        //3- Check for conflicts
        //pending /sub && change /sub/property => conflict
        //pending /sub1 && change /sub2 => no conflict
        if (item.edits && item.edits.length) {

            const conflicts = item.edits.filter(e => {
                const c = change.patches.find(c => c.path.startsWith(e.do.path));
                if (c) {
                    e.conflict = c;
                    return true;
                }
                return false;
            }); //todo other op conflicts
            if (conflicts.length) {
                const results = await this.conflictStrategy.overwrite(conflicts);
                results.forEach(r => {
                    if (!r.overwrite) item.edits.splice(item.edits.indexOf(r.edit), 1);
                });
            }

        }

        //4- Apply edits
        item.editedDoc = JsonPatch.patch(item.editedDoc, item.edits.map(e => e.do));
        this.local.setLocalStorageItem(path.collection, path.id, item);

        //Notify
        this._change$.next(change); // notify change listeners
        // if (notifyStreams) {
        //     const keys = this.cache.keys();
        //     keys.forEach(s => this._notifyStreamIfChangeIsRelevant(change, s));
        // }

    }

    private _notifyStreamIfChangeIsRelevant(change: DataChange, path: string) {
        const reload = change.path.startsWith(path);
        //todo
        //if s.filter => then to know if it is affected  by the change the filter should be applied to change (and paths cascade properly)
        //if s.page => does change fall within this page (maybe _id lookup can help)
        //if s.sort => does not matter
        if (reload) {
            //const newData = this.local.get(path);
            //this.cache.notify(path, { data: newData, source: { type: 'change', change } });
        }
    }

    /**
     * Trigger the data synchronization job
     * @param immediately will cause the job to run now.
     * @returns if immediately param is passed true the sync job promise is returned, if false null is returned
     */
    start(reloadData: boolean, immediately = false): Promise<boolean> | null {
        this._refreshData$.reset(); //reset timer to call again later
        if (immediately) return this._startSync(reloadData);
        else {
            this._sync$.next(reloadData);
            return null;
        }
    }

    /**
     * Data sync job which consists of 3 steps
     * 1. Get required data from server and refresh the local store accordingly
     * 2. Get server pending edits to apply it on local data and maintain consistency
     * 3. Send local pending edits to server to apply changes on server
     * @param reloadData wether or not to reload all cached data
     */
    private async _startSync(reloadData: boolean): Promise<boolean> {
        if (!this.connection.isOnline) return false;

        //const deleted = await this.api.get("/api/change");

        const fetchRequests = [...this._fetchRequests];
        if (reloadData) {
            //To reload data we should avoid redundant api calls, So:
            //1- we will only reload data that streams are actively subscribed to.
            //2- No need for sub-doc if doc is loaded (get shortest possible paths)
            //3- No need for doc if collection is loaded (TODO this one means to wait for collections requests and scan results)
            // const paths = this.cache.keys().map(path => PathInfo.parse(path));


            // for (let i = 0; i < paths.length; i++) {
            //     const p = paths[i];
            //     if (p.id) {
            //         const existingPath = fetchRequests.find(x => x.startsWith(p.path));
            //         if (existingPath) fetchRequests[fetchRequests.indexOf(existingPath)] = p.path; //add if it's shorter (more generic)
            //         else fetchRequests.push(p.path);
            //     }
            //     else if (fetchRequests.indexOf(p.path) === -1)
            //         fetchRequests.push(p.path); //changing filter or page could change data so add it
            // }

        }

        if (fetchRequests.length) {
            const fetchTasks = fetchRequests.map(path => this.fetch(path));
            const results = await Promise.all(fetchTasks);

            //todo make use of results
            //todo handle error

            this._fetchRequests = [];
        }


        const patchRequests = this.local.getLocalStorageItems();
        for (let i = 0; i < patchRequests.length; i++) {
            const x = patchRequests[i];

            if (!x.item || !x.item.edits || !x.item.edits.length) continue;

            const edits = x.item.edits;
            x.item.edits = [];
            this.local.setLocalStorageItem(x.collection, x.id, x.item);

            try {
                const result = await this.api.patch(`/${x.collection}/${x.id}`, edits.map(e => e.do));
            } catch (error) {
                x.item.edits = edits;
                this.local.setLocalStorageItem(x.collection, x.id, x.item);
            }
        }

        return true;

    }


}



