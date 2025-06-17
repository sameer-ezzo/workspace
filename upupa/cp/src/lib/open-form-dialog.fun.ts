import { Injector, inject, ComponentRef, runInInjectionContext, ViewRef, ElementRef } from "@angular/core";
import { NgControl } from "@angular/forms";
import { Class } from "@noah-ark/common";
import { ActionDescriptor, provideComponent, waitForOutput } from "@upupa/common";
import { DialogConfig, DialogRef, DialogService } from "@upupa/dialog";
import { FormViewModelMirror, reflectFormViewModelType, DataFormComponent, SubmitResult } from "@upupa/dynamic-form";
import { MatBtnComponent } from "@upupa/mat-btn";
import { firstValueFrom, fromEvent } from "rxjs";
import { ExtractViewModel } from "./buttons/helpers";

function isFormViewModelMirror(vm: FormViewModelMirror | Class): vm is FormViewModelMirror {
    return "viewModelType" in vm;
}

export async function openFormDialog<TViewModelClass extends Class | FormViewModelMirror, TViewModel = ExtractViewModel<TViewModelClass>>(
    vm: TViewModelClass,
    value: TViewModel,
    context: { injector?: Injector; dialogOptions?: DialogConfig; defaultAction?: ActionDescriptor | boolean; closeOnSuccess?: boolean } = {},
) {
    const result = {} as {
        dialogRef: DialogRef<DataFormComponent<TViewModel>, SubmitResult<TViewModel>>;
        componentRef: ComponentRef<DataFormComponent<TViewModel>>;
        elementRef: ElementRef<HTMLElement>;
        submit: Promise<SubmitResult<TViewModel>>;
        submit_success: Promise<TViewModel>;
        submit_error: Promise<Error>;
    };
    const _injector = context?.injector ?? inject(Injector);
    const injector = Injector.create({ providers: [{ provide: NgControl, useValue: undefined }], parent: _injector }); // disconnect parent form control (dialog form will start a new control context)
    const dialog = injector.get(DialogService);
    const _mirror = isFormViewModelMirror(vm) ? vm : reflectFormViewModelType(vm);
    const mirror = { ..._mirror, actions: [] };

    const v = await runInInjectionContext(injector, async () => value && typeof value === "function" ? value() : value);

    let formActions = [...(_mirror.actions ?? [])] as ActionDescriptor[];
    let defaultAction = formActions.find((x) => x.type === "submit");
    if (context.defaultAction && !defaultAction) {
        defaultAction = context.defaultAction === true ? ({ text: "Submit", icon: "save", color: "primary", type: "submit" } as ActionDescriptor) : context.defaultAction;
        formActions = [defaultAction, ...formActions];
    }

    const options: DialogConfig = {
        width: "90%",
        maxWidth: "750px",
        maxHeight: "95vh",
        disableClose: true,
        ...context?.dialogOptions,
        footer: [
            ...formActions.map((descriptor) =>
                provideComponent({
                    component: MatBtnComponent,
                    inputs: { buttonDescriptor: descriptor },
                    outputs: {
                        action: async () => {
                            if (descriptor.type === "submit") {
                                const componentInstance = await firstValueFrom(dialogRef.afterAttached()).then((ref) => ref.instance);
                                componentInstance.submit();
                            }
                        },
                    },
                }),
            ),
        ],
    };

    const dialogRef = dialog.open<DataFormComponent<TViewModel>, TViewModel, SubmitResult<TViewModel>>(
        { component: DataFormComponent<TViewModel>, inputs: { viewModel: mirror, value: v }, injector },
        options,
    );
    const componentRef: ComponentRef<DataFormComponent<TViewModel>> = await firstValueFrom(dialogRef.afterAttached());

    const elementRef = componentRef.injector.get<ElementRef<HTMLElement>>(ElementRef<HTMLElement>);
    fromEvent(elementRef.nativeElement, "keydown").subscribe((event: KeyboardEvent) => {
        if (event.key === "Escape" && componentRef.instance.dynamicFormEl().form().pristine) {
            dialogRef.close();
        }
    });

    if (context?.closeOnSuccess !== false) {
        const sub = componentRef.instance.submitted.subscribe((result) => {
            if (result.submitResult) dialogRef.close(result);
        });
    }

    result.dialogRef = dialogRef;
    result.componentRef = componentRef;
    result.elementRef = elementRef;
    result.submit = waitForOutput(componentRef.instance, "submitted");
    result.submit_success = waitForOutput(componentRef.instance, "submit_success");
    result.submit_error = waitForOutput(componentRef.instance, "submit_error");

    return result;
}
