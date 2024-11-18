import { Component, Input, OnChanges, SimpleChanges, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicFormModule, FormScheme, textField } from '@upupa/dynamic-form';
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
            console.log("view model change",this.viewModelDefinition)
            if (!this.viewModelDefinition) throw new Error('invalid view model')
            this.value = new this.viewModel()
        }
    }
    //contact us form example
    // FormScheme: FormScheme = {
    //     contactorName: textField('contactor-name', 'your name')
    //     // {
    //     //     name: 'contactor-name',
    //     //     input: 'text',
    //     //     text: 'Your name',
    //     //     validations: [{ name: 'required' }]
    //     // },
    //     ,
    //     'contactor-email': {
    //         name: 'contactor-email',
    //         input: 'email',
    //         text: 'Your email',
    //         validations: [{ name: 'email' }, { name: 'required' }]
    //     },
    //     'your-msg': {
    //         name: 'contactor-msg',
    //         input: 'textarea',
    //         text: 'Your Message',
    //         validations: [{ name: 'maxLength', arguments: 500 }],
    //     }
    // }


}
