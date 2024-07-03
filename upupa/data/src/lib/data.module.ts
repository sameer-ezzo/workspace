import { NgModule, ModuleWithProviders } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { APIBASE } from './di.token';
import { DataConfig } from './model';




@NgModule({ imports: [], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class DataModule {

  constructor() {
    // if (parentModule) {
    //   throw new Error('DataModule is already loaded. Import it in the AppModule only');
    // }
  }


  public static forChild(api_base: string, config?: DataConfig): ModuleWithProviders<DataModule> {

    return {
      ngModule: DataModule,
      providers: [
        {
          provide: APIBASE,
          useValue: api_base ?? '/api'
        },
        {
          provide: DataConfig,
          useValue: config
        }
      ]
    };
  }


}
