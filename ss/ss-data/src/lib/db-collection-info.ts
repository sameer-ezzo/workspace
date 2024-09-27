import { ModelDefinition } from '@nestjs/mongoose';
import { Model, Schema } from 'mongoose';

export type ModelDefinitionInfo = Omit<ModelDefinition, 'schema' | 'name'> & {
  schema: Schema;
  model?: Model<unknown>;
  exclude?: string[];
};

export type DbModelDefinitionInfo = {
  [modelName: string]: ModelDefinitionInfo;
};
