import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthorizeActionDirective } from "./authorize-action.directive";
import { PERMISSIONS_BASE_URL } from "./di.tokens";


@NgModule({
    imports: [CommonModule, AuthorizeActionDirective],
    declarations: [],
    exports: [AuthorizeActionDirective],
    providers: [],
})
export class AuthorizeModule {
    // constructor(@Optional() @SkipSelf() parentModule: AuthModule) {
    //     if (parentModule) {
    //         throw new Error('AuthModule is already loaded. Import it in the AppModule only');
    //     }
    // }

    public static forRoot(baseUrl: string) {
        return {
            ngModule: AuthorizeModule,
            providers: [{ provide: PERMISSIONS_BASE_URL, useValue: baseUrl }],
        };
    }
}
