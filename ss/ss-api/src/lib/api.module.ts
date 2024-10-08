import { DynamicModule } from '@nestjs/common';
import { ApiController } from './api.controller';

export type ApiOptions = {
  allowReadAnonymous: boolean;
  allowWriteAnonymous: boolean;
};

export class ApiModule {
  static register(): DynamicModule {
    return {
      global: true,
      module: ApiModule,
      controllers: [ApiController],
    };
  }
}
