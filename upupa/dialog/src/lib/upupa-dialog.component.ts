import { AfterViewInit, ViewEncapsulation, HostListener, inject, DestroyRef, PLATFORM_ID, signal, input, computed, ComponentRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import { Component } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, startWith } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { ActionDescriptor, ActionEvent, DynamicComponent, PortalComponent } from '@upupa/common';
import { MatBtnComponent } from '@upupa/mat-btn';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DialogRefD, UpupaDialogActionContext, UpupaDialogPortal } from './dialog.service';

@Component({
    selector: 'upupa-dialog',
    standalone: true,
    imports: [MatDialogModule, MatBtnComponent, MatButtonModule, MatIconModule, PortalComponent],
    templateUrl: './upupa-dialog.component.html',
    styleUrls: ['./upupa-dialog.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: {
        '[class]': 'hostClass()',
    },
    // providers: [{ provide: MatDialogRef, useFactory: (upupa: UpupaDialogComponent) => upupa.dialogRef, deps: [UpupaDialogComponent] }],
})
export class UpupaDialogComponent<C = any> implements UpupaDialogPortal<C>, AfterViewInit {
    hostClass = computed(() => [this.panelClass(), this.dialogActions().length > 0 ? 'y-scroll' : ''].join(' '));
    panelClass = input<string, string>('upupa-dialog-container', {
        transform: (v: string) => `upupa-dialog-container ${(v ?? '').replace('upupa-dialog-container', '')}`,
    });

    dialogActions = signal([]);
    title = signal<string>('');
    subTitle = signal<string>('');
    hideCloseButton = signal<boolean>(true);

    private readonly destroyRef = inject(DestroyRef);
    private _afterAttached$ = new Subject<ComponentRef<any>>();

    @HostListener('keyup', ['$event'])
    keyup(e) {
        if (e.key === 'Escape' && this.dialogData.canEscape === true) {
            e.preventDefault();
            e.stopPropagation();
            this.close();
        }
    }

    onAttached(e: any) {
        this._afterAttached$.next(e.componentRef);
    }

    public dialogData = inject(MAT_DIALOG_DATA) as DialogRefD;
    dialogRef: MatDialogRef<UpupaDialogComponent<C>> = inject(MatDialogRef);
    template = signal<DynamicComponent>(null);
    constructor() {
        const data = this.dialogData as DialogRefD['data'];
        this.dialogRef.addPanelClass('upupa-dialog-overlay');
        this.template.set(data.component);
        this.dialogActions.set((data.dialogActions || []) as ActionDescriptor[]);
        this.title.set(data.title || '');
        this.subTitle.set(data.subTitle);
        this.hideCloseButton.set(data.hideCloseButton === true);

        this.dialogRef['afterAttached'] = () => {
            return this._afterAttached$.asObservable();
        };
        this.dialogRef.componentInstance;
        // this.dialogRef['instanceRef'] = signal<any>(null);
    }

    // inject platform id
    private readonly platformId = inject(PLATFORM_ID);
    ngAfterViewInit() {
        this.registerWidthWatcher();
    }

    private registerWidthWatcher() {
        if (isPlatformBrowser(this.platformId))
            fromEvent(window, 'resize')
                .pipe(startWith(0), debounceTime(50), takeUntilDestroyed(this.destroyRef))
                .subscribe((e) => {
                    if (window.innerWidth < 790) this.dialogRef.updateSize('80%');
                    else this.dialogRef.updateSize('100%');
                });
    }

    async onAction(e: ActionEvent<any, UpupaDialogActionContext<C>>) {
        e.context = {
            ...e.context,
            dialogRef: this.dialogRef,
            // component: this.component,
            host: this,
        };
    }

    close() {
        this.dialogRef?.close();
    }
}
