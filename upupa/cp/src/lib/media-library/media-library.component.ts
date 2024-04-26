import { ChangeDetectionStrategy, Component, Injector, OnDestroy } from "@angular/core";
import { LanguageService } from "@upupa/language";
import { AuthService } from "@upupa/auth";
import { HttpClient } from "@angular/common/http";
import { DataService } from "@upupa/data";
import { BehaviorSubject, Subject } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { SnackBarService } from "@upupa/common";
import { EventBus } from "@upupa/common";
import { ScaffoldingService } from "../scaffolding.service";
import { FileInfo } from "@noah-ark/common";




@Component({
    selector: "cp-media-library",
    templateUrl: "./media-library.component.html",
    styleUrls: ["./media-library.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaLibraryComponent implements OnDestroy {

    // @ViewChild("filterDrawer") filterDrawer: any;
    destroyed$ = new Subject<void>();

    view$ = new BehaviorSubject<'list' | 'grid'>('list')
    files = []
    focused = undefined as FileInfo | undefined
    path$ = new BehaviorSubject<string>('/')
    // adapter$ = this.path$.pipe(map())
    // filterButtonActionDescriptor = { name: 'filter', icon: 'filter_list', header: true, variant: 'icon', handler: (event: ActionEvent) => this.toggleFilterDrawer() } as ActionDescriptor
    constructor(
        public injector: Injector,
        public auth: AuthService,
        public http: HttpClient,
        public languageService: LanguageService,
        public scaffolder: ScaffoldingService,
        public ds: DataService,
        public route: ActivatedRoute,
        public snack: SnackBarService,
        public bus: EventBus) { }


    ngOnDestroy() {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    // async onAction(x: ActionEvent) {
    //     const path = PathInfo.parse(this.inputs.path, 1);
    //     switch (x.action.name) {
    //         case "create":
    //             await this.openFormDialog(this.collection, x);
    //             break;
    //         case "edit":
    //             await this.openFormDialog(this.collection, x);
    //             break;
    //         case "delete": {
    //             if (x.data.length === 0) return
    //             const dialogData = {
    //                 maxWidth: "450px",
    //                 title: "Delete",
    //                 confirmText: "Are you sure you want to delete this item?",
    //                 yes: 'Yes, delete',
    //                 no: 'No, cancel',
    //                 yesColor: "warn",

    //             } as ConfirmOptions;
    //             const confirmRes = await this.confirmService.openWarning(dialogData)
    //             if (confirmRes === true) {
    //                 for (const item of x.data) {
    //                     try {
    //                         await this.ds.delete(`${path.path}/${item._id}`);
    //                     }
    //                     catch (err) {
    //                         console.error(err);
    //                     }
    //                 }
    //                 await this.ds.refreshCache(path.path);
    //                 this.inputs.adapter.refresh();
    //             }
    //             break;
    //         }
    //         default:
    //             this.bus.emit(
    //                 `${this.collection}_${x.action.name}`,
    //                 {
    //                     msg: `${this.collection}_${x.action.name}`,
    //                     ...x,
    //                 },
    //                 this
    //             );
    //             break;
    //     }
    // }
}
