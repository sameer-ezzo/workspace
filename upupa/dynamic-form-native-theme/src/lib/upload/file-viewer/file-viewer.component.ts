import { Component, Input, forwardRef, ElementRef, input, model, computed, inject, output } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { BreakpointObserver } from "@angular/cdk/layout";
import { FileUploadService } from "../file-upload.service";
import { SelectionModel } from "@angular/cdk/collections";
import { FileEvent, ViewerExtendedFileVm } from "../viewer-file.vm";
import { FileTemplateComponent } from "./file-template/file-template.component";

@Component({
    standalone: true,
    selector: "file-viewer",
    templateUrl: "./file-viewer.component.html",
    styleUrls: ["./file-viewer.component.scss"],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => FilesViewerComponent), multi: true }],
    host: {
        "[class]": "'content'+ ' ' + view()",
    },
    imports: [FileTemplateComponent],
})
export class FilesViewerComponent {
    focused = model<ViewerExtendedFileVm>();

    dragging = input(false);
    dateFormat = input("dd MMM yyyy");

    includeAccess = input(false);
    base = input<string>("");
    path = input<string>("");
    readOnly = input(false);

    imageResizeOptions = "";

    hasMore = true;

    view = input<"grid" | "list">("list");
    imageDim = computed(() => (this.view() === "grid" ? 220 : 65));

    selectable = input(false);
    value = input<ViewerExtendedFileVm[]>([]);

    events = output<FileEvent>();
    @Input() canUpload = true;

    selectionModel = new SelectionModel<string>(true, [], true);

    protected host = inject(ElementRef<HTMLElement>);
    public fileUploader = inject(FileUploadService);
    protected breakpointObserver = inject(BreakpointObserver);

    async onFileEvent(event: FileEvent) {
        if (event.name === "remove") {
        }

        this.events.emit(event);
    }

    loadMore() {
        // this.adapter
    }
}
