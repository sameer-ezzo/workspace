import { Component, ViewChild, Input, signal } from '@angular/core';
import { DynamicFormComponent } from '@upupa/dynamic-form';
import { Observable, Subscription } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { ActionEvent, SnackBarService, UpupaDialogComponent, UpupaDialogPortal } from '@upupa/common';
import { DataService } from '@upupa/data';
import { ActivatedRoute, Router } from '@angular/router';
import { DataFormResolverResult, FormSubmitResult } from '../../types';
import { PathInfo } from '@noah-ark/path-matcher';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'cp-data-form',
    templateUrl: './data-form.component.html',
    styleUrls: ['./data-form.component.scss']
})
export class DataFormComponent implements UpupaDialogPortal {


    resolverResult: DataFormResolverResult;
    dialogRef?: MatDialogRef<UpupaDialogComponent>;
    model = signal<any>(null)

    sub: Subscription
    private _formResolverResult: Observable<DataFormResolverResult>
    @Input()
    public get formResolverResult(): Observable<DataFormResolverResult> {
        return this._formResolverResult;
    }
    public set formResolverResult(value: Observable<DataFormResolverResult>) {
        this._formResolverResult = value;
        this.sub?.unsubscribe()

        this.sub = value.pipe(
            tap(x => this.resolverResult = x),
            switchMap(s => s.formViewModel.value$)).subscribe(model => {
                this.model.set(model)
            });
    }


    constructor(private ds: DataService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private snack: SnackBarService) {
        this.formResolverResult = this.activatedRoute.data.pipe(
            switchMap(s => s['scheme'] as Observable<DataFormResolverResult>)
        );

    }

    @ViewChild('dynForm') form: DynamicFormComponent
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

        const pathInfo = PathInfo.parse(this.resolverResult.path, 1);
        const formViewModel = this.resolverResult.formViewModel;

        if (formViewModel.valueToRecord)
            try {
                value = await formViewModel.valueToRecord(this.form, value);
            } catch (error) {
                this.handleSubmitError(error)
            }

        let submitResult: FormSubmitResult;
        if (formViewModel.onSubmit) {
            try {
                submitResult = await formViewModel.onSubmit(pathInfo.path, this.model());
            }
            catch (error) {
                this.handleSubmitError(error)
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
            }
            else {
                try {
                    res = await this.ds.post(pathInfo.path, value);
                } catch (error) {
                    this.handleSubmitError(error)
                }
            }
        }

        submitResult ??= formViewModel.defaultSubmitOptions;
        if (submitResult) await this.handleSubmit(submitResult, value);
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
            await this.submit(this.model)
        }
        else if (e.action.meta?.closeDialog === true) ref.close(e)
    }

}