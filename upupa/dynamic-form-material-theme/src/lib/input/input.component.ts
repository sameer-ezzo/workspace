import { ChangeDetectionStrategy, Component, Directive, forwardRef, input, Pipe, TemplateRef, ViewContainerRef, ViewEncapsulation } from "@angular/core";
import { FormControl, NG_VALUE_ACCESSOR, ValidationErrors } from "@angular/forms";
import { InputComponent } from "@upupa/dynamic-form-native-theme";

@Component({
    selector: "mat-form-input",
    templateUrl: "./input.component.html",
    styleUrls: ["./input.component.scss"],
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatInputComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatInputComponent extends InputComponent {}

@Component({
    selector: "hidden-input",
    template: ` <input type="hidden" [value]="value() ?? ''" /> `,
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => HiddenInputComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HiddenInputComponent extends InputComponent {}

@Directive({
    selector: "[errors]",
})
export class ErrorsDirective {
    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
    ) {}

    errors = input<ValidationErrors>();
    control = input<FormControl>(undefined, { alias: "errorsControl" }); // alias is required to prefix the directive

    getErrors(errors: ValidationErrors) {
        if (!errors) return [];
        return Object.keys(errors).map((key) => this.getError(key, errors[key]));
    }

    getError(key: string, validatorArgument: any) {
        let fieldName = "Field";
        let value = undefined;
        const control = this.control();
        if (control) {
            value = control.value;
            fieldName = control['name'] ?? Object.entries(control?.parent.controls).find(([key, value]) => value === control)?.[0];
        }
        switch (key) {
            case "required":
                return `${fieldName} is required.`;
            case "requiredTrue":
                return `${fieldName} must be checked.`;
            case "pattern":
                return `${fieldName} must match the pattern ${validatorArgument}.`;
            case "max":
                return `${fieldName} must be maximum of ${validatorArgument}.`;
            case "min":
                return `${fieldName} must be minimum of ${validatorArgument}.`;
            case "greaterThan":
                return `${fieldName} must be grater than ${validatorArgument}.`;
            case "lessThan":
                return `${fieldName} must be less than ${validatorArgument}.`;
            case "maxLength":
                if (value?.length > 0) return `${fieldName} number characters ${value.length} must be maximum of ${validatorArgument}.`;
                else return `${fieldName} number of characters must be maximum of ${validatorArgument}.`;
            case "minLength":
                if (value?.length > 0) return `${fieldName} number characters ${value.length} must be minimum of ${validatorArgument}.`;
                else return `${fieldName} number of characters must be minimum of ${validatorArgument}.`;
            case "latin":
                return `${fieldName} must be latin characters.`;
            case "email":
                return `${fieldName} must be a valid email address.`;
            case "timeSpanMax":
                return `${fieldName} must be maximum of ${validatorArgument}.`;
            case "timeSpanMin":
                return `${fieldName} must be minimum of ${validatorArgument}.`;
            default:
                return `${fieldName} is invalid.`;
        }
    }

    ngOnChanges() {
        this.viewContainer.clear();
        const error = this.errors();

        if (error) {
            for (const err of this.getErrors(error)) {
                this.viewContainer.createEmbeddedView(this.templateRef, { $implicit: err });
            }
        }
    }
}
