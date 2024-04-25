import { Component, ViewChild, Input, inject, DestroyRef, signal, effect } from '@angular/core';
import { DynamicFormComponent } from '@upupa/dynamic-form';
import { filter, switchMap } from 'rxjs/operators';
import { ActionEvent, SnackBarService, UpupaDialogComponent, UpupaDialogPortal } from '@upupa/common';
import { DataService } from '@upupa/data';
import { ActivatedRoute, Router } from '@angular/router';
import { DataFormResolverResult, FormSubmitResult } from '../../types';
import { PathInfo } from '@noah-ark/path-matcher';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';




@Component({
    selector: 'cp-data-form',
    templateUrl: './data-form.component.html',
    styleUrls: ['./data-form.component.scss']
})
export class DataFormComponent implements UpupaDialogPortal<DataFormComponent> {


    dialogRef?: MatDialogRef<UpupaDialogComponent<DataFormComponent>>;
    private readonly destroyRef = inject(DestroyRef)

    private _form: DynamicFormComponent;
    @ViewChild('dynForm')
    public get form(): DynamicFormComponent {
        return this._form;
    }
    public set form(value: DynamicFormComponent) {
        this._form = value;
        this.form.formElement.statusChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(status => {
                const submitButton = this.formResolverResult.formViewModel.actions.find(a => a.type === 'submit')
                submitButton.disabled = status !== 'VALID'
            })
    }



    sub: Subscription
    private _formResolverResult: DataFormResolverResult
    @Input()
    public get formResolverResult(): DataFormResolverResult {
        return this._formResolverResult;
    }
    public set formResolverResult(value: DataFormResolverResult) {
        if (!value) return;
        this._formResolverResult = value;
        this.actions.set(value.formViewModel.actions || [])

    }

    loading = signal(false)
    actions = signal([])
    constructor(private ds: DataService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private snack: SnackBarService) {
    }

    ngAfterViewInit() {
        if (!this.formResolverResult) {
            this.activatedRoute.data.pipe(
                switchMap(s => s['scheme']),
                filter(s => !!s))
                .subscribe((scheme: DataFormResolverResult) => {
                    this.formResolverResult = scheme
                });
        }
    }

    setLoading(loading: boolean) {
        this.loading.set(loading)
        const actions = this.actions()
        const submitButtonIdx = actions.findIndex(a => a.type === 'submit')
        if (submitButtonIdx === -1) return
        actions[submitButtonIdx] = { ...actions[submitButtonIdx], disabled: loading }
        this.actions.set(actions.slice())
    }

    async submit(value) {
        const form = this.form
        if (!form) return
        if (form.invalid) {
            form.markAsTouched()
            form.scrollToError()
            return
        } else {
            if (form.pristine) {
                this.dialogRef.close(null)
                // return
            }
        }
        this.setLoading(true)

        const pathInfo = PathInfo.parse(this.formResolverResult.path, 1);
        const formViewModel = this.formResolverResult.formViewModel;

        if (formViewModel.valueToRecord)
            try {
                value = await formViewModel.valueToRecord(this.form, value);
            } catch (error) {
                this.handleSubmitError(error)
            }
            finally {
                this.setLoading(false)
            }

        let submitResult: FormSubmitResult;
        if (formViewModel.onSubmit) {
            try {
                submitResult = await formViewModel.onSubmit(pathInfo.path, this.form.value);
            }
            catch (error) {
                this.handleSubmitError(error)
            }
            finally {
                this.setLoading(false)
            }
        }
        else if (formViewModel.onSubmit === undefined) {
            let res = null as any;
            if (value._id) {
                const p = pathInfo.segments.length === 1 ? pathInfo.path + '/' + value._id : pathInfo.path;
                const v = Object.assign({}, value);
                delete v._id;
                try {
                    res = await this.ds.put(p, v);
                } catch (error) {
                    this.handleSubmitError(error)
                }
                finally {
                    this.setLoading(false)
                }
            }
            else {
                try {
                    res = await this.ds.post(pathInfo.path, value);
                } catch (error) {
                    this.handleSubmitError(error)
                }
                finally {
                    this.setLoading(false)
                }
            }
        }

        submitResult ??= formViewModel.defaultSubmitOptions;
        if (submitResult) {
            try {
                await this.handleSubmit(submitResult, value);
            } catch (error) {
                this.handleSubmitError(error)
            }
            finally {
                this.setLoading(false)
            }
        }
    }
    handleSubmitError(error: any) {
        const e = error.error ?? error
        alert(e.message ?? e.code ?? e.status)
    }


    async handleSubmit(submitionResult: FormSubmitResult, value: any) {

        if (submitionResult.successMessage) this.snack.openSuccess(submitionResult.successMessage);
        if (submitionResult.redirect) this.router.navigateByUrl(submitionResult.redirect);
        if (submitionResult.closeDialog) this.dialogRef.close(value);
    }

    async onAction(e: ActionEvent, ref: MatDialogRef<UpupaDialogComponent>): Promise<any | ActionEvent> {
        if (e.action.type === 'submit') {
            await this.submit(this.form.value)
        }
        else if (e.action.meta?.closeDialog === true) ref.close(e)
    }

}