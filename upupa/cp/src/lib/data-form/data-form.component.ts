import { Component, ViewChild, Input, inject, DestroyRef, signal, SimpleChanges } from "@angular/core";
import { DynamicFormCommands, DynamicFormComponent, DynamicFormEvents, DynamicFormModule, FormScheme } from "@upupa/dynamic-form";
import { debounceTime, map } from "rxjs/operators";
import { ActionDescriptor, ActionEvent } from "@upupa/common";
import { DataService } from "@upupa/data";
import { ActivatedRoute, Router } from "@angular/router";
import { DataFormResolverResult, FormSubmitResult } from "../../types";
import { PathInfo } from "@noah-ark/path-matcher";
import { MatDialogRef } from "@angular/material/dialog";
import { Observable, Subscription } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Condition } from "@noah-ark/expression-engine";
import { defaultFormActions } from "../../defaults";
import { SnackBarService, UpupaDialogComponent, UpupaDialogPortal } from "@upupa/dialog";
import { AuthorizeModule } from "@upupa/authz";
import { MatBtnComponent } from "@upupa/mat-btn";

@Component({
    selector: "cp-data-form",
    standalone: true,
    imports: [AuthorizeModule, MatBtnComponent,DynamicFormModule],
    templateUrl: "./data-form.component.html",
    styleUrls: ["./data-form.component.scss"],
})
export class DataFormComponent<T = any> implements UpupaDialogPortal<DataFormComponent<T>> {
    private _formChangesSub: Subscription;
    private _form: DynamicFormComponent;
    @ViewChild("dynForm")
    public get form(): DynamicFormComponent {
        return this._form;
    }
    public set form(dForm: DynamicFormComponent) {
        this._form = dForm;
        this._formChangesSub?.unsubscribe();
        if (!this.form) return;
        this._formChangesSub = dForm.formElement.valueChanges
            .pipe(
                debounceTime(100),
                takeUntilDestroyed(this.destroyRef),
                map((v) => (dForm.formElement.valid ? "VALID" : "INVALID")),
            )
            .subscribe((status) => {
                this.dialogActions.set(this._actions.map((a) => (a.type === "submit" ? { ...a, disabled: status !== "VALID" } : a)));
            });
    }

    setFormValue(value: any) {
        this.formValue.set(value);
    }

    dialogRef?: MatDialogRef<UpupaDialogComponent<DataFormComponent>>;
    dialogActions = signal([]);

    formValue = signal(undefined as T);
    private readonly ds = inject(DataService);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly snack = inject(SnackBarService);
    private readonly destroyRef = inject(DestroyRef);

    loading = signal(false);

    @Input() idPath: string = "_id";

    @Input() path: string;
    @Input() name?: string;
    @Input() preventDirtyUnload?: boolean;
    @Input() recaptcha?: string;
    @Input() theme?: string;
    @Input() initialValueFactory?: () => Promise<T>;
    @Input() fields: FormScheme;
    @Input() value$: Observable<T>;
    private _actions: ActionDescriptor[];
    @Input()
    public get actions(): ActionDescriptor[] {
        return this._actions;
    }
    public set actions(value: ActionDescriptor[]) {
        this._actions = value || [];
        this.dialogActions.set((value || []).slice());
    }
    @Input() conditions?: Condition<DynamicFormEvents.AnyEvent, DynamicFormCommands.AnyCommands>[];
    @Input() valueToRecord?: (form: DynamicFormComponent, value: T) => Promise<any>;
    @Input() onSubmit?: (path: string, record: any) => Promise<FormSubmitResult>;
    @Input() defaultSubmitOptions?: FormSubmitResult;

    ngOnInit() {
        const formResolverResult = this.activatedRoute.snapshot.data["scheme"] as DataFormResolverResult;
        if (formResolverResult) {
            const changes = { path: this.path, ...formResolverResult };
            this.init(changes);
        }
    }

    init(changes: Record<string, unknown>) {
        if (changes["path"]) this.path = changes["path"] as string;
        if (changes["name"]) this.name = changes["name"] as string;
        if (changes["preventDirtyUnload"]) this.preventDirtyUnload = changes["preventDirtyUnload"] as boolean;
        if (changes["recaptcha"]) this.recaptcha = changes["recaptcha"] as string;
        if (changes["theme"]) this.theme = changes["theme"] as string;
        if (changes["initialValueFactory"]) this.initialValueFactory = changes["initialValueFactory"] as () => Promise<T>;
        if (changes["fields"]) this.fields = changes["fields"] as FormScheme;
        if (changes["value"]) this.value$ = changes["value$"] as Observable<T>;
        if (changes["actions"]) this.actions = changes["actions"] as ActionDescriptor[];
        if (changes["conditions"]) this.conditions = changes["conditions"] as Condition<DynamicFormEvents.AnyEvent, DynamicFormCommands.AnyCommands>[];
        if (changes["valueToRecord"]) this.valueToRecord = changes["valueToRecord"] as (form: DynamicFormComponent, value: T) => Promise<any>;
        if (changes["onSubmit"]) this.onSubmit = changes["onSubmit"] as (path: string, record: any) => Promise<FormSubmitResult>;
        if (changes["defaultSubmitOptions"]) this.defaultSubmitOptions = changes["defaultSubmitOptions"] as FormSubmitResult;

        if (this.value$) {
            this.value$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((v) => {
                this.formValue.set(v);
            });
        }
        if (!this.path && !this.onSubmit) {
            this.path = "/";
            this.onSubmit = async (path, record) => {
                return { closeDialog: true };
            };
        }
        if (!this.fields || Object.getOwnPropertyNames(this.fields).length === 0) throw new Error("DataFormComponent requires a FormScheme");
        if ((this.actions || []).length === 0) this.actions = defaultFormActions;
    }

    ngOnChanges(changes: SimpleChanges) {
        this.init(
            Object.entries(changes)
                .map((c) => ({ [c[0]]: c[1].currentValue }))
                .reduce((a, c) => ({ ...a, ...c }), {}),
        );
    }

    setLoading(loading: boolean) {
        this.loading.set(loading);
        this.dialogActions.set(this._actions.map((a) => (a.type === "submit" ? { ...a, disabled: loading } : a)));
    }

    async submit(value) {
        const formEl = this.form?.formElement;
        if (!formEl) return;
        if (formEl.invalid) {
            if (formEl.touched) return this.form.scrollToError();
        } else if (formEl.pristine) {
            this.handleSubmit(this.defaultSubmitOptions, value);
        }

        this.setLoading(true);

        if (this.valueToRecord) {
            try {
                value = await this.valueToRecord(this.form, value);
            } catch (error) {
                this.handleSubmitError(error);
            } finally {
                this.setLoading(false);
            }
        }

        let submitResult: FormSubmitResult;
        if (this.onSubmit) {
            try {
                submitResult = await this.onSubmit(this.path, this.form.value);
            } catch (error) {
                this.handleSubmitError(error);
            } finally {
                this.setLoading(false);
            }
        } else if (this.onSubmit === undefined) {
            const pathInfo = PathInfo.parse(this.path, 1);
            let res = null as any;
            if (value[this.idPath]) {
                const p = pathInfo.segments.length === 1 ? pathInfo.path + "/" + value[this.idPath] : pathInfo.path;
                const v = Object.assign({}, value);
                delete value[this.idPath];
                try {
                    res = await this.ds.put(p, v);
                } catch (error) {
                    this.handleSubmitError(error);
                } finally {
                    this.setLoading(false);
                }
            } else {
                try {
                    res = await this.ds.post(pathInfo.path, value);
                } catch (error) {
                    this.handleSubmitError(error);
                } finally {
                    this.setLoading(false);
                }
            }
        }

        submitResult ??= this.defaultSubmitOptions;
        if (submitResult) {
            try {
                await this.handleSubmit(submitResult, value);
            } catch (error) {
                this.handleSubmitError(error);
            } finally {
                this.setLoading(false);
            }
        }
    }
    handleSubmitError(error: any) {
        const e = error.error ?? error;
        this.snack.openFailed(e.message ?? e.code ?? e.status);
    }

    async handleSubmit(submissionResult: FormSubmitResult, value: any) {
        if (submissionResult.successMessage) this.snack.openSuccess(submissionResult.successMessage);
        if (submissionResult.redirect) this.router.navigateByUrl(submissionResult.redirect);
        if (submissionResult.closeDialog) this.dialogRef.close(value);
    }

    async onAction(e: ActionEvent): Promise<void> {
        const dialogRef = e.context?.dialogRef;
        if (e.action.type === "submit") {
            try {
                await this.submit(this.form.value);
                dialogRef.close(this.form.value);
            } catch (error) {
                console.error(error);
            }
        } else dialogRef.close();
    }
}
