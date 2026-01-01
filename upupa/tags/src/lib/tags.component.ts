import { Component, Input, OnInit, SimpleChanges, ViewChild } from "@angular/core";
import { DataService, ObjectId, ClientDataSource, DataAdapter } from "@upupa/data";
import { MatDialog } from "@angular/material/dialog";
import { TagFormComponent } from "./tag-form/tag-form.component";
import { hiddenField, selectField, textField, Field } from "@upupa/dynamic-form";
import { map } from "rxjs/operators";

import { firstValueFrom } from "rxjs";
import { TagsService } from "./tags.service";
import { MatTreeComponent } from "@upupa/dynamic-form-material-theme";

/*
<form-tree #treeInput *ngIf="adapter" [adapter]="adapter"
  (valueChanged)="setTreeActions($event)"
  [(value)]="value"
    [nodeActions]="nodeActions" [treeActions]="treeActions"

   [hierarchyType]="'parent'"
  (onNodeAction)="onNodeAction($event)" (onTreeAction)="onTreeAction($event)"></form-tree>

   */
@Component({
    selector: "tags-tree",
    template: ``,
    styles: [],
})
export class TagsComponent implements OnInit {
    @ViewChild("treeInput") treeInput: MatTreeComponent;

    @Input() path: string;

    nodeActions: any[] = [
        { name: "add", icon: "add", text: "add" },
        { name: "edit", icon: "edit", text: "edit" },
        { name: "remove", icon: "clear", text: "remove" },
    ];
    treeActions: any[] = [{ name: "add", icon: "add", text: "add" }];

    scheme: Field[];
    adapter: DataAdapter<any>;
    value: any[];

    @Input() parentPath: string;
    constructor(
        public dialog: MatDialog,
        private tagsService: TagsService,
        private dataService: DataService,
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes["parent"] || changes["collection"]) {
            // const dataSource = new ClientDataSource(this.tagsService.getTags(this.parentPath));
            // this.adapter ??= new DataAdapter(dataSource, "_id", "name", undefined, null, { page: { pageSize: 10000 } });
        }
    }

    setTreeActions(value: any) {
        if (value?.length > 0) {
            this.treeActions.push({ name: "remove", icon: "clear", text: "remove" });
        } else {
            this.treeActions = [{ name: "add", icon: "add", text: "add" }];
        }
    }

    async ngOnInit(): Promise<void> {
        try {
            // this.scheme = await firstValueFrom(this.tagsService.getTags(this.parentPath ??= '/').pipe(
            //     map(tags => this.adapter = new DataAdapter(new ClientDataSource(tags), '_id', 'name', undefined, null, { page: { pageSize: 100000 } })),
            //     map(parentsAdapter => {
            //         return [
            //             hiddenField('_id'),
            //             textField('name', 'Name', null, 'This name must be unique and written in English only, try not to use any spaces between words'),
            //             textField('text', 'Text'),
            //             textField('lang', 'Language Code (ar, en, ...)'),
            //             selectField('parent', 'Parent', parentsAdapter, null, null, null, 1),
            //         ]
            //     })));
        } catch (err) {
            console.error(err);
        }
    }

    async onTreeAction(e: { name: string; data: any }) {
        switch (e.name) {
            case "add":
                this.addTag({});
                break;
            case "edit":
                this.removeTag(e.data);
                break;
        }
    }

    async onNodeAction(e: { name: string; data: any }) {
        const data = e.data.normalized.item;
        switch (e.name) {
            case "add":
                this.addTag(data);
                break;
            case "edit":
                this.editTag(data);
                break;
            case "remove":
                this.removeTag(data);
                break;
            default:
        }
    }

    private refresh(node?: any) {
        this.adapter.refresh();
        if (node) {
            // reopen parent node
        }
    }

    private async editTag(data: any) {
        const res = await firstValueFrom(
            this.dialog
                .open(TagFormComponent, {
                    data: { node: data, scheme: this.scheme },
                })
                .afterClosed(),
        );

        if (res) {
            this.refresh(data);
        }
    }

    private async addTag(data: any) {
        const tag = { _id: ObjectId.generate(), parent: data?.name, name: "", text: "", lang: data?.lang ?? "en" };
        const res = await firstValueFrom(
            this.dialog
                .open(TagFormComponent, {
                    data: {
                        node: tag,
                        scheme: this.scheme,
                    },
                })
                .afterClosed(),
        );

        if (res) {
            this.refresh(data);
        }
    }

    private async removeTag(data: any) {
        await this.tagsService.removeTag(data);
        this.refresh();
    }
}
