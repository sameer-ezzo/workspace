import { DynamicModule, Module } from '@nestjs/common';
import { DataModule } from '@ss/data';
import { RulesModule } from '@ss/rules';
import { ApiController } from './api.controller';

export type ApiOptions = {
  allowReadAnonymous: boolean;
  allowWriteAnonymous: boolean;
};
/*
const allowReadAnonymous =
      process.env.allowReadAnonymous === 'true' ?? true;
    const allowWriteAnonymous =
      process.env.allowWriteAnonymous === 'true' ?? false; */
// @Module({
//   controllers: [ApiController],
//   imports: [RulesModule, DataModule],
// })
export class ApiModule {
  static register(): DynamicModule {
    return {
      global: true,
      module: ApiModule,
      controllers: [ApiController],
    };
  }
}
