import { Injectable } from '@angular/core';
import { FormViewScaffolder } from './base-form-view.scaffolder';

@Injectable({ providedIn: 'root' })
export class FormViewScaffolderService<T extends new (...args: any[]) => T> extends FormViewScaffolder<T> {
}