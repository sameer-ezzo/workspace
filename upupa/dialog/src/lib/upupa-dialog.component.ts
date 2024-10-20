import {
    TemplateRef,
    Inject,
    ViewChild,
    Optional,
    ComponentRef,
    SimpleChange,
    SimpleChanges,
    AfterViewInit,
    reflectComponentType,
    Input,
    ViewEncapsulation,
    HostListener,
    inject,
    DestroyRef,
    PLATFORM_ID,
    signal,
} from '@angular/core';
import {
    MatDialogRef,
    MAT_DIALOG_DATA,
    MatDialogModule,
} from '@angular/material/dialog';
import {
    CdkPortalOutletAttachedRef,
    ComponentPortal,
    PortalModule,
} from '@angular/cdk/portal';
import { Component } from '@angular/core';
import { fromEvent } from 'rxjs';
import { debounceTime, startWith, takeUntil } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { ActionEvent, ActionsDescriptor } from '@upupa/common';
import { MatBtnComponent } from '@upupa/mat-btn';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UpupaDialogActionContext, UpupaDialogPortal } from './dialog.service';

@Component({
    selector: 'upupa-dialog',
    standalone: true,
    imports: [
        MatDialogModule,
        MatBtnComponent,
        MatButtonModule,
        PortalModule,
        MatIconModule,
    ],
    templateUrl: './upupa-dialog.component.html',
    styleUrls: ['./upupa-dialog.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: {
        '[class]': 'panelClass',
    },
})
export class UpupaDialogComponent<C = any>
    implements UpupaDialogPortal<C>, AfterViewInit
{
    private _panelClass = 'upupa-dialog-container';
    @Input()
    public get panelClass() {
        return this._panelClass;
    }
    public set panelClass(value) {
        this._panelClass =
            'upupa-dialog-container ' +
            value.replace('upupa-dialog-container', '');
        this.dialogRef.addPanelClass('upupa-dialog-overlay');
    }

    @ViewChild('templatePortalContent')
    templatePortalContent: TemplateRef<unknown>;
    component;
    componentPortal: ComponentPortal<any>;
    dialogActions = signal([]);
    title: string;
    subTitle: string;
    showCloseBtn = true;
    private readonly destroyRef = inject(DestroyRef);
    @HostListener('keyup', ['$event'])
    keyup(e) {
        if (e.key === 'Escape' && this.dialogData.canEscape === true) {
            e.preventDefault();
            e.stopPropagation();
            this.close();
        }
    }

    dialogRef: MatDialogRef<UpupaDialogComponent<C>>;

    constructor(@Optional() @Inject(MAT_DIALOG_DATA) public dialogData: any) {
        this.dialogRef = this.dialogData.dialogRef ?? inject(MatDialogRef);
        this.componentPortal = new ComponentPortal(this.dialogData.component);

        const actions = (this.dialogData.actions ||
            this.dialogData.dialogActions ||
            []) as ActionsDescriptor[];
        this.dialogActions.set(actions);
        if (actions.length > 0) this._panelClass += ' scroll-y';
        this.title = dialogData.title;
        this.subTitle = dialogData.subTitle;
        this.showCloseBtn = dialogData.hideCloseBtn !== true;
        dialogData.outputs ?? { action: () => {} };
    }

    // inject platform id
    private readonly platformId = inject(PLATFORM_ID);
    ngAfterViewInit() {
        this.registerWidthWatcher();
    }

    private registerWidthWatcher() {
        if (isPlatformBrowser(this.platformId))
            fromEvent(window, 'resize')
                .pipe(
                    startWith(0),
                    debounceTime(50),
                    takeUntilDestroyed(this.destroyRef)
                )
                .subscribe((e) => {
                    if (window.innerWidth < 790)
                        this.dialogRef.updateSize('80%');
                    else this.dialogRef.updateSize('100%');
                });
    }

    onAttached(portalOutletRef: CdkPortalOutletAttachedRef) {
        portalOutletRef = portalOutletRef as ComponentRef<any>;
        this.component = portalOutletRef.instance;
        this.component.dialogRef = this.dialogRef;
        this.component.dialogActions = this.dialogActions;

        const meta = reflectComponentType(this.dialogData.component);
        const { inputs, outputs } = meta;

        if (this.dialogData.inputs) {
            const inputsData = this.dialogData.inputs;
            const inputsKeys = Object.getOwnPropertyNames(inputsData);
            if (inputsKeys.length > 0) {
                const changes = {} as SimpleChanges;
                for (const inputName of inputsKeys) {
                    const input = inputs.find(
                        (i) => i.templateName === inputName
                    );
                    if (input) {
                        changes[input.templateName] = {
                            currentValue: inputsData[inputName],
                            firstChange: true,
                            previousValue: undefined,
                        } as SimpleChange;
                        this.component[inputName] = inputsData[inputName];
                    } else
                        console.warn(
                            `The component ${meta.type.name} is missing an input named: ${inputName}`
                        );
                }
                if (this.component.ngOnChanges)
                    this.component?.ngOnChanges(changes);
                this.component.changeDetectorRef?.detectChanges();
            }
        }

        if (this.dialogData.outputs) {
            const outputsData = this.dialogData.outputs;
            const outputsKeys = Object.getOwnPropertyNames(outputsData);
            if (outputsKeys.length > 0) {
                for (const outputName of outputsKeys) {
                    const output = outputs.find(
                        (i) => i.templateName === outputName
                    );
                    if (output)
                        this.component[outputName]
                            .pipe(takeUntil(this.dialogRef.afterClosed()))
                            .subscribe((e) => {
                                this.dialogData.outputs[outputName]?.(e, {
                                    dialogRef: this.dialogRef,
                                    component: this.component,
                                    host: this,
                                });
                            });
                    else
                        console.warn(
                            `The component ${meta.type.name} is missing an output named: ${outputName}`
                        );
                }
            }
        }
    }

    async onAction(e: ActionEvent<any, UpupaDialogActionContext<C>>) {
        e.context = {
            ...e.context,
            dialogRef: this.dialogRef,
            component: this.component,
            host: this,
        };
        if (this.component.onAction) await this.component.onAction(e);
        else {
            this.dialogData.outputs?.action?.(e);
            // if (this.dialogRef.getState() === MatDialogState.OPEN)
            //   if (e.action.meta?.closeDialog === true)
            //     if (e.action.type === 'submit') this.dialogRef.close(this.component);
            //     else this.dialogRef.close();
        }
    }

    close() {
        this.dialogRef?.close();
    }
}
