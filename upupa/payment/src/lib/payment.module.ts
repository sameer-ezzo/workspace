import { NgModule, ModuleWithProviders } from "@angular/core";
import { PaymentCardComponent } from "./payment-card/payment-card.component";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatStepperModule } from "@angular/material/stepper";
import { MatInputModule } from "@angular/material/input";
import { MatRadioModule } from "@angular/material/radio";
import { MatSelectModule } from "@angular/material/select";
import { FormsModule } from "@angular/forms";
import { PaymentMethodComponent } from "./payment-method/payment-method.component";
import { PAYBASE } from "./di.tokens";
import { UtilsModule } from "@upupa/common";
import { DynamicFormModule } from "@upupa/dynamic-form";
import { MatMenuModule } from "@angular/material/menu";

@NgModule({
    declarations: [],
    imports: [
        PaymentCardComponent,
        PaymentMethodComponent,
        CommonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MatMenuModule,
        MatButtonModule,
        MatIconModule,
        FormsModule,
        MatExpansionModule,
        MatStepperModule,
        MatRadioModule,
        UtilsModule,
        DynamicFormModule,
    ],
    exports: [PaymentCardComponent, PaymentMethodComponent],
})
export class PaymentModule {
    public static forRoot(urlBase: string): ModuleWithProviders<PaymentModule> {
        return {
            ngModule: PaymentModule,
            providers: [{ provide: PAYBASE, useValue: urlBase }],
        };
    }
}
