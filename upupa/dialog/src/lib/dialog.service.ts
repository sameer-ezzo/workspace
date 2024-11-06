import {
    Injectable,
    TemplateRef,
    Inject,
    ElementRef,
    EventEmitter,
    SimpleChanges,
    SimpleChange,
    Signal,
    Type,
    input,
    inject,
} from '@angular/core';
import {
    MatDialog,
    MatDialogConfig,
    MatDialogRef,
} from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import { firstValueFrom, Subject, Observable } from 'rxjs';
import { ActionDescriptor, ActionEvent, DynamicComponent } from '@upupa/common';
import { UpupaDialogComponent } from './upupa-dialog.component';

export type UpupaDialogActionContext<C = any> = {
    host: UpupaDialogComponent<C>;
    component: C;
    dialogRef: MatDialogRef<UpupaDialogComponent<C>>;
} & Record<string, unknown>;

export interface UpupaDialogPortal<C = any> {
    dialogRef?: MatDialogRef<UpupaDialogComponent<C>>;
    dialogActions?: Signal<ActionDescriptor[]>;
    onAction?(e: ActionEvent<any, UpupaDialogActionContext<C>>): Promise<void>;
}

export type UpupaDialogInputs = {
    title?: string;
    subTitle?: string;
    hideCloseButton?: boolean;
    canEscape?: boolean;
    dialogActions?: ActionDescriptor[];
};
export type DialogServiceConfig<T = any> = Omit<MatDialogConfig<T>, 'data'> &
    UpupaDialogInputs & {
        inputs?: { [input: string]: any };
        outputs?: Record<string, (e: any) => void | Promise<void>>;

        closingClasses?: string[];
        closeTimeout?: number;
        autoFullScreen?: boolean;

        data?: T;
    };
export type DialogRefD<P = any> = DialogServiceConfig<P> & {
    data: P & {
        component: DynamicComponent;
        dialogRef: MatDialogRef<any>;
    } & Record<string, any>;
};

@Injectable({ providedIn: 'root' })
export class DialogService {
    readonly defaultConfig: DialogServiceConfig<any> = {
        width: '100%',
        maxWidth: '700px',
        maxHeight: '80vh',
        autoFullScreen: true,
        closeTimeout: 400,
        closingClasses: [],
        hideCloseButton: false,
        canEscape: true,
    };

    private _dialogOpened$: Subject<boolean> = new Subject<boolean>();
    private _dialogClosed$: Subject<boolean> = new Subject<boolean>();

    get dialogOpened$(): Observable<boolean> {
        return this._dialogOpened$;
    }
    get dialogClosed$(): Observable<boolean> {
        return this._dialogClosed$;
    }

    stack = 0;

    private readonly dialog = inject(MatDialog);
    private readonly document = inject(DOCUMENT);

    openDialog<P = any, D = any, R = any>(
        template:
            | Type<any>
            | ComponentType<P>
            | TemplateRef<P>
            | DynamicComponent,
        options?: DialogServiceConfig<D>
    ): MatDialogRef<UpupaDialogComponent, R> {
        if (!template) throw new Error('ComponentType is not provided!');

        const inputs = options?.inputs ?? {};
        const outputs = options?.outputs ?? {};
        delete options?.inputs;
        delete options?.outputs;

        const upupaDialogInputs: UpupaDialogInputs = {
            title: options?.title,
            subTitle: options?.subTitle,
            hideCloseButton: options?.hideCloseButton,
            canEscape: options?.canEscape,
            dialogActions: options?.dialogActions ?? [],
        };
        Object.getOwnPropertyNames(upupaDialogInputs).forEach((key) => {
            delete options[key];
        });

        const dialogOptions = {
            ...this.defaultConfig,
            ...options,
            data: {
                dialogRef: undefined,
                component: template,
                ...(options?.data ?? {}),
                inputs,
                ...upupaDialogInputs,
            } as D,
        } as DialogRefD<D>;

        const _template: DynamicComponent =
            template && 'component' in template
                ? (template as DynamicComponent)
                : ({
                      component: template,
                      inputs: {},
                      outputs: {},
                      class: '',
                  } as DynamicComponent);

        _template.inputs = inputs ?? {};
        _template.outputs = outputs ?? {};
        dialogOptions.data['component'] = _template;

        this._dialogOpened$.next(true);
        const dialogRef = this.dialog.open<UpupaDialogComponent, D, R>(
            UpupaDialogComponent,
            dialogOptions
        );
        // dialogOptions.data['dialogRef'] = dialogRef;
        return dialogRef;
    }

    open<T, D = any, R = any>(
        componentOrTemplateRef: ComponentType<T> | TemplateRef<T>,
        config?: DialogServiceConfig<D>
    ): MatDialogRef<T, R> {
        //CONFIG
        const _config: DialogServiceConfig<D> = Object.assign(
            {},
            this.defaultConfig,
            { direction: this.document.body.dir || 'ltr' },
            config
        );
        if (_config.autoFullScreen && this.document.body.clientWidth < 500) {
            _config.maxHeight = '100vh';
            _config.height = '100vh';
            _config.maxWidth = '100vw';
            _config.width = '100vw';
        }
        if (_config.closingClasses?.length) {
            _config.exitAnimationDuration = '0ms';
            _config.enterAnimationDuration = '0ms';
        }

        const disableClose = _config.disableClose;
        _config.disableClose =
            _config.closingClasses?.length > 0 && !disableClose;

        //OPEN
        const dialogRef = this.dialog.open(componentOrTemplateRef, _config);
        this.stack++;
        if (!disableClose && _config.closingClasses?.length) {
            const backdrop: HTMLDivElement =
                this._containerInstance(dialogRef)._overlayRef._backdropElement;
            backdrop.addEventListener('click', () => {
                this.close(dialogRef, _config);
            });
        }

        //INPUTS
        if (_config.inputs) {
            const component = dialogRef.componentInstance as any;
            const inputs = _config.inputs;
            const changes = {} as SimpleChanges;
            for (const input in inputs) {
                component[input] = inputs[input];
                changes[input] = new SimpleChange(
                    undefined,
                    component[input],
                    true
                );
            }
            if ('ngOnChanges' in component) component.ngOnChanges(changes);
        }

        //OUTPUTS
        if (dialogRef.componentInstance['closed']) {
            //TODO check outputs using component factory
            const output = dialogRef.componentInstance[
                'closed'
            ] as EventEmitter<R>;
            firstValueFrom(output).then((r) => {
                this.close(dialogRef, _config, r);
            });
        }

        if (_config.hideCloseButton !== true) {
            const _container: ElementRef<HTMLElement> =
                this._containerInstance(dialogRef)._elementRef;
            const container = _container.nativeElement;
            container.style.position = 'relative';

            const b = this._styleCloseButton(
                this.document.createElement('button')
            );
            b.addEventListener(
                'click',
                () => {
                    this.close(dialogRef as any, _config);
                },
                false
            );

            container.prepend(b);
        }

        this._dialogOpened$.next(true);

        return dialogRef;
    }

    private _containerInstance<T>(ref: MatDialogRef<T>): any {
        return ref['_containerInstance'];
    }

    private _styleCloseButton(b: HTMLButtonElement) {
        b.style.fontSize = '1.5em';
        b.style.cursor = 'pointer';
        b.style.background = 'none';
        b.style.border = 'none';
        b.style.outline = 'none';
        b.style.lineHeight = '1';

        b.style['z-index'] = '999';
        b.tabIndex = -1;

        //b.innerHTML = '&#x2716' //✖
        b.innerHTML = '&#10005'; //✕

        return b;
    }

    close<T, R>(
        ref: MatDialogRef<T>,
        config: DialogServiceConfig<any>,
        result?: R
    ) {
        this._dialogClosed$.next(true);

        result ??= ref.componentInstance['model'] as R;
        if (!config?.closingClasses || !config?.closingClasses.length)
            return ref.close(result);

        const outletElement: HTMLDivElement =
            this._containerInstance(ref)._overlayRef._portalOutlet
                .outletElement;

        const handler = () => {
            --this.stack;
            ref.close(result);
            ref.removePanelClass(config.closingClasses);
        };

        outletElement.addEventListener('transitionend', handler, {
            once: true,
        });
        outletElement.addEventListener('animationend', handler, { once: true });

        setTimeout(() => {
            if (outletElement.classList.contains(config.closingClasses[0])) {
                console.log('dialog-closed-after-timeout');
                outletElement.removeEventListener('transitionend', handler);
                outletElement.removeEventListener('animationend', handler);
                handler();
            }
        }, this.defaultConfig.closeTimeout);

        ref.addPanelClass(config.closingClasses);
    }
}
