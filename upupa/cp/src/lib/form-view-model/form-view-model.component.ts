import { Component, Input, OnChanges, SimpleChanges, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicFormModule } from "../../../../dynamic-form/src/lib/dynamic-form.module";
import { FormScheme, textField } from '@upupa/dynamic-form';
import { extractFormScheme } from '../decorators/form-view-model.decorator';

@Component({
    selector: 'raptor7-workspace-form-view-model',
    standalone: true,
    imports: [CommonModule, DynamicFormModule],
    templateUrl: './form-view-model.component.html',
    styleUrl: './form-view-model.component.scss',
})
export class FormViewModelComponent<T = unknown> implements OnChanges {
    @Input({ required: true }) viewModel: Type<any>
    @Input() value: T
    viewModelDefinition: { formAttributes: { name: string; }; fields: FormScheme; };
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['viewModel']) {
            this.viewModelDefinition = extractFormScheme(this.viewModel)
            if (!this.viewModelDefinition) throw new Error('invalid view model')
            this.value = new this.viewModel()
        }
    }
    //contact us form example
    // FormScheme: FormScheme = {
    //     contactorName: textField('contactor-name', 'your name')
    //     // {
    //     //     type: 'field',
    //     //     name: 'contactor-name',
    //     //     input: 'text',
    //     //     text: 'Your name',
    //     //     validations: [{ name: 'required' }]
    //     // },
    //     ,
    //     'contactor-email': {
    //         type: 'field',
    //         name: 'contactor-email',
    //         input: 'email',
    //         text: 'Your email',
    //         validations: [{ name: 'email' }, { name: 'required' }]
    //     },
    //     'your-msg': {
    //         type: 'field',
    //         name: 'contactor-msg',
    //         input: 'textarea',
    //         text: 'Your Message',
    //         validations: [{ name: 'maxLength', arguments: 500 }],
    //     }
    // }


}
