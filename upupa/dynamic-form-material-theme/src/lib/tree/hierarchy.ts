import { CollectionViewer, SelectionChange } from "@angular/cdk/collections";
import { DataSource } from "@angular/cdk/table";
import { FlatTreeControl } from "@angular/cdk/tree";
import { NormalizedItem, DataAdapter } from "@upupa/data";
import { BehaviorSubject, Observable, combineLatest } from "rxjs";
import { map } from "rxjs/operators";


export interface HierarchicalC<T> {
  children?: T[];
}

export interface HierarchicalP<T> {
  parent: string | number;
}

export type Hierarchical<T = any> = HierarchicalC<T> & HierarchicalP<T>;


export type HierarchicalNode<T extends Hierarchical<T> = any> = NormalizedItem<T> & {
  parent?: HierarchicalNode<T>;
  children?: HierarchicalNode<T>[];
  level: number;
  expandable: boolean;
}

export interface Hierarchy<T extends Hierarchical<T>> {
  buildHierarchy(array: any[], key: string);
  normalizeHierarchy(parent: HierarchicalNode<T>, normalized: NormalizedItem<T>, level: number): HierarchicalNode<T>;

}

/**
 * File database, it can build a tree structured Json object from string.
 * Each node in Json object represents a file or a directory. For a file, it has filename and type.
 * For a directory, it has filename and children (a list of files or directories).
 * The input will be a json object string, and the output is a list of `FileNode` with nested
 * structure.
 */
export class HierarchyByChildren<T extends Hierarchical<T> = any> implements Hierarchy<T> {



  constructor(public adapter: DataAdapter<T>, public readonly resolveChildren: (item: T) => Promise<T[]> = async item => await item.children) { }



  // async setParent(node: HierarchicalNode<T>, newParentNode?: HierarchicalNode<T>) {

  //   const item = node.normalized.item;
  //   if (node.parent) {
  //     const parent = node.parent.normalized.item;
  //     const siblings = await parent.children;
  //     const i = siblings.indexOf(item);
  //     siblings.splice(i, 1);
  //     parent.children = siblings.slice();
  //   } else {
  //     const i = this.adapter.dataSource.data.indexOf(item);
  //     this.data.splice(i, 1);
  //   }


  //   if (newParentNode) {
  //     const newParent = newParentNode.normalized.item;
  //     const newSiblings = (await newParent.children) ?? [];
  //     newSiblings.push(item);
  //     newParent.children = newSiblings.slice();
  //   } else {
  //     this.adapter.dataSource.data.push(item);
  //   }

  //   // notify the change
  //   //this.adapter.dataSource.refresh();

  // }

  buildHierarchy(array: any[], key: string) {
    return array;
  }

  normalizeHierarchy(parent: HierarchicalNode<T>, normalized: NormalizedItem<T>, level: number): HierarchicalNode<T> {
    normalized['level'] = level;
    normalized['parent'] = parent;
    normalized['expandable'] = normalized.item.children != undefined;
    return normalized as HierarchicalNode<T>;
  }

}




export class HeirarchyByParent<T extends Hierarchical<T> = any> {



  constructor(public adapter: DataAdapter<T>,
    public readonly resolveChildren: (item: T) => Promise<T[]> = async item => await item.children) {


  }


  async setParent(node: HierarchicalNode, newParentNode?: HierarchicalNode) {
    const item = node.item;
    (<any>item).parent = newParentNode?.key;
  }

  buildHierarchy(array: any[], key: string) {
    var map = {}, node, roots = [], i;

    for (i = 0; i < array.length; i += 1) {
      map[array[i][key]] = i;
      array[i].children = [];
    }

    for (i = 0; i < array.length; i += 1) {
      node = array[i];
      if (node.parent) array[map[node.parent]].children.push(node);
      else roots.push(node);
    }
    return roots;
  }


  normalizeHierarchy(parent: HierarchicalNode<T>, normalized: NormalizedItem<T>, level: number): HierarchicalNode<T> {
    normalized['level'] = level;
    normalized['parent'] = parent;
    normalized['expandable'] = normalized.item.children != undefined;
    return normalized as HierarchicalNode<T>;
  }

}