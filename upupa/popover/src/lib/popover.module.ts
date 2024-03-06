import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OverlayModule } from '@angular/cdk/overlay';

import { PopoverComponent } from './popover.component';
import { PopoverTrigger } from './popover-trigger';
import { PopoverTarget } from './popover-target';
import { A11yModule } from '@angular/cdk/a11y';
@NgModule({
    imports: [
        OverlayModule,
        CommonModule,
        A11yModule
    ],
    exports: [PopoverComponent, PopoverTrigger, PopoverTarget],
    declarations: [PopoverComponent, PopoverTrigger, PopoverTarget],
})
export class PopoverModule { }
