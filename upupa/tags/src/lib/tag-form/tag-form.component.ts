import { Component, Inject, Injector, OnInit, Optional } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Field } from "@upupa/dynamic-form";
import { TagsService } from "../tags.service";

@Component({
    selector: "tag-form",
    templateUrl: "./tag-form.component.html",
    styleUrls: ["./tag-form.component.css"],
})
export class TagFormComponent implements OnInit {
    fields: Field[];
    node: any;

    private tagsService: TagsService;
    // constructor(private tagsService: TagsService) { }
    constructor(
        injector: Injector,
        @Optional() private dialogRef: MatDialogRef<TagFormComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    ) {
        // for some reason dialogRef and MAT_DIALOG_DATA is not injected automatically.
        this.data = injector.get(MAT_DIALOG_DATA);
        if (this.data) {
            this.fields = this.data.scheme;
            this.node = this.data.node;
        }
    }

    async ngOnInit(): Promise<void> {}

    async save() {
        try {
            const tag = Object.assign({}, this.node);
            delete tag.children;
            await this.tagsService.saveTag(tag);
            this.dialogRef.close(tag);
        } catch (error) {
            console.error(error);
        }
    }
}
