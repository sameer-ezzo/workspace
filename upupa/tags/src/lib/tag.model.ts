

export interface Tag {
  _id: string;
  name: string;
  parent: string;
  parentPath: string;
  
  class?: string;
  meta?: Record<string, unknown>;
};
