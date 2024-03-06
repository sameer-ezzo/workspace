import { NgModule, ModuleWithProviders } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { APIBASE } from './di.token';
import { DataConfig } from './model';




@NgModule({
  imports: [HttpClientModule],
  exports: [HttpClientModule]
})
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
          useValue: api_base
        },
        {
          provide: DataConfig,
          useValue: config
        }
      ]
    };
  }


}
