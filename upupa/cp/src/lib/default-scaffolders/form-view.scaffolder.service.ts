import { Injectable } from '@angular/core';
import { DataService } from '@upupa/data';


import { FormViewScaffolder } from './base-form-view.scaffolder';
import { ConfirmService } from '@upupa/common';
import { ScaffoldingService } from '../scaffolding.service';

@Injectable({ providedIn: 'root' })
export class FormViewScaffolderService<T extends new (...args: any[]) => T> extends FormViewScaffolder<T> {
    constructor(
        public override readonly scaffolder: ScaffoldingService,
        public override readonly data: DataService,
        public override readonly confirm: ConfirmService) {
        super(scaffolder, data, confirm);
    }
}