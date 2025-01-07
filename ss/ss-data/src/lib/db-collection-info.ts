import { ModelDefinition } from '@nestjs/mongoose';
import { FlatRecord, Model, Schema, SchemaOptions } from 'mongoose';

export type ModelDefinitionInfo = Omit<ModelDefinition, 'schema' | 'name'> & {
  schema: Schema;
  options?: SchemaOptions<FlatRecord<unknown>>;
  model?: Model<unknown>;
  exclude?: string[];
};

export type DbModelDefinitionInfo = {
  [modelName: string]: ModelDefinitionInfo;
};
