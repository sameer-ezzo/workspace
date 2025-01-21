import { Component, inject, model, Injector } from "@angular/core";
import { SignUpFormComponent } from "../signup-form/signup-form.component";

@Component({
    standalone: true,
    selector: "signup",
    styleUrls: ["./signup.component.scss"],
    templateUrl: "./signup.component.html",
    imports: [SignUpFormComponent],
})
export class SignUpComponent {

    model = model();

    private readonly injector = inject(Injector);
    onSuccess(value: any) {
        // if (this.options.on_success) {
        //     runInInjectionContext(this.injector, () => this.options.on_success(this, value));
        // }
    }

    onFailed(err: any) {
        // if (this.options.on_error) {
        //     runInInjectionContext(this.injector, () => this.options.on_error(this, err));
        // }
    }
}
