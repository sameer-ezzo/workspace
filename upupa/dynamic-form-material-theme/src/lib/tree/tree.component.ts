import { Component, Input, forwardRef, SimpleChanges } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { NestedTreeControl } from '@angular/cdk/tree';
import { DataAdapter, NormalizedItem } from '@upupa/data';
import { HierarchicalNode } from './hierarchy';
import { map } from 'rxjs/operators';
import { MatTreeNestedDataSource } from '@angular/material/tree';

/*
TODO:
if drag drop were to be added:
1. This component is considred to be a form control with value 2-way binding (no changes allowed over adapter.data)
2. heirachy.setParent must also provide index to insert the item instead of always pushing it

*/

@Component({ standalone: true,
    selector: 'mat-form-tree-input',
    templateUrl: './tree.component.html',
    styleUrls: ['./tree.component.css'],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MatTreeComponent), multi: true }],
    exportAs: 'TreeInput',
})
export class MatTreeComponent {
    treeControl = new NestedTreeControl<HierarchicalNode>((node) => node.children, { trackBy: (node) => node.key });
    dataSource = new MatTreeNestedDataSource<HierarchicalNode>();

    constructor() {
        this.treeControl.collapseAll = () => {};
    }

    hasChild = (_: number, node: HierarchicalNode) => !!node.item.children && node.item.children.length > 0;
    @Input() adapter!: DataAdapter;
    @Input() hierarchyType!: string;

    ngOnChanges(changes: SimpleChanges) {
        if (changes['adapter']) {
            // if (this.hierarchyType === 'children') this.hierarchy = new HierarchyByChildren(this.adapter)
            // else this.hierarchy = new HeirarchyByParent(this.adapter);
            // this.adapter.normalized$.pipe(map((data) => data.map((x) => this.normalizeHierarchy(null, x, 0)))).subscribe((n) => (this.dataSource.data = n));
        }
    }

    normalizeHierarchy(parent: HierarchicalNode, normalized: NormalizedItem, level: number): HierarchicalNode {
        const node = normalized as HierarchicalNode;
        node.level = level;
        node.parent = parent;
        node.expandable = normalized.item?.children?.length > 0;
        normalized['children'] = node.expandable ? normalized.item.children.map((x) => this.normalizeHierarchy(node, this.adapter.normalize(x), level + 1)) : [];
        return normalized as HierarchicalNode;
    }
}

// @Component({ standalone: true,
//   selector: 'form-tree',
//   templateUrl: './tree.component.html',
//   styleUrls: ['./tree.component.css'],
//   providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TreeComponent), multi: true, }],
//   exportAs: 'TreeInput'
// })
// export class TreeComponent extends FlatTreeControl<HierarchicalNode>  {

//   @Input() filterTerms: string[];
//   @Input() label: string;
//   @Input() hint: string;
//   @Input() errorMessages: { [errorCode: string]: string } = {};

//   @Input() hierarchyType: 'children' | 'parent' = 'children';
//   @Input() selectable = false;

//   @Input() multiple = false;

//   @Input() adapter: DataAdapter;

//   @Input() nodeActions: any[] = [];
//   @Input() treeActions: any[] = [];

//   @Output() onNodeAction = new EventEmitter();
//   @Output() onTreeAction = new EventEmitter();

//   @Input() nodeTemplate: any;
//   @Input() collapsibleNodeTemplate: any;
//   @ViewChild('defaultNodeTemplate') defaultNodeTemplate: any;
//   @ViewChild('defaultCollapsibleNodeTemplate') defaultCollapsibleNodeTemplate: any;

//   constructor() {
//     super(node => node.level, node => node.expandable);
//   }

//   data$: Observable<HierarchicalNode[]>;
//   ngOnInit() {

//     this.expansionModel.changed.subscribe((change: SelectionChange<HierarchicalNode>) => {
//       if (change.added) change.added.forEach(node => this.toggleNode(node, true));
//       if (change.removed) change.removed.slice().reverse().forEach(node => this.toggleNode(node, false));
//     });

//     this.data$ = this.adapter.normalized$.pipe(map(data => data.map(x => this.hierarchy.normalizeHierarchy(null, x, 0))))
//     this.data$.subscribe(data => this.dataNodes = data)

//   }

//   async toggleNode(node: HierarchicalNode, expand: boolean) {

//     if (!Array.isArray(node.item.children)) node.item.children = await this.hierarchy.resolveChildren(node.item);
//     const children = node.item.children;

//     const index = this.dataNodes.indexOf(node);
//     if (!children || index < 0) return; // If no children, or cannot find the node, no op

//     if (expand) {
//       const nodes = children.map(x => this.hierarchy.normalizeHierarchy(node, this.adapter.normalize(x), node.level + 1));
//       this.dataNodes.splice(index + 1, 0, ...nodes);
//     } else {
//       let count = 0;
//       for (let i = index + 1; i < this.dataNodes.length && this.dataNodes[i].level > node.level; i++, count++) { }
//       this.dataNodes.splice(index + 1, count);
//     }

//     // notify the change
//     this.dataNodes = this.dataNodes.slice();
//   }

//   @ViewChild('treeElement') treeElement: ElementRef<HTMLElement>;
//   draggedPlaceholder: any;
//   draggedPreviousIndex: number;
//   basePosition: number;
//   level: number;
//   dragging(event: CdkDragMove) {

//     const placeholderTransform = this.draggedPlaceholder.attributeStyleMap.get('transform');
//     const indexDelta = (placeholderTransform?.[0].y.value ?? 0) / 48;
//     const dragOverIndex = this.draggedPreviousIndex + indexDelta

//     const draggedNode = this.dataNodes[this.draggedPreviousIndex];
//     const above = this.dataNodes[dragOverIndex - 1];
//     const under = this.dataNodes[dragOverIndex];

//     const maxLevel = above ? above.level + 1 : 0;
//     const minLevel = under.level;

//     const maxPoint = maxLevel * 40;
//     const minPoint = minLevel * 40;

//     const normalizedX = event.pointerPosition.x - this.basePosition;
//     if (normalizedX > maxPoint || minPoint === maxPoint) this.level = maxLevel;
//     else if (normalizedX < minPoint) this.level = minLevel;
//     else {
//       const positionRatio = normalizedX / maxPoint - minPoint;
//       this.level = Math.round(positionRatio * (maxLevel - minLevel));
//     }

//     // let level = this.level;
//     // let parent = above;
//     // while (level <= above.level) {
//     //   parent = parent.parent;
//     //   level++;
//     // }
//     //parent.class //todo show visual feedback about the dragged item new parent

//     //if (transform) transform[0].x.value = 100;

//   }
//   dragStart(node: any) {
//     this.draggedPreviousIndex = this.dataNodes.indexOf(node);
//     this.draggedPlaceholder = this.treeElement.nativeElement.querySelector<any>('.drag-placeholder')
//     this.basePosition = this.treeElement.nativeElement.getClientRects()[0].x;
//   }
//   async drop(event: CdkDragDrop<string[]>) {
//     if (!event.isPointerOverContainer) return;

//     const from = this.dataNodes[event.previousIndex];
//     const above = this.dataNodes[event.currentIndex - 1];
//     const under = this.dataNodes[event.currentIndex];

//     let level = this.level;
//     let parent = above;
//     while (level <= above.level) {
//       parent = parent.parent;
//       level++;
//     }

//     //this.hierarchy.setParent(from, parent);

//     //from.level = this.level;
//     //moveItemInArray(this.dataNodes, event.previousIndex, event.currentIndex);
//     //this.hierarchy.dataChange$.next(null);

//   }

//   ngOnChanges(changes: SimpleChanges) {

//     if (changes['adapter']) {
//       if (this.hierarchyType === 'children') this.hierarchy = new HierarchyByChildren(this.adapter)
//       else this.hierarchy = new HeirarchyByParent(this.adapter);

//       this.data$?.subscribe(data => {
//         this.dataNodes = data;
//         this.dataNodes
//       })
//     }
//     // if (changes['control'] && this.control) {
//     //   this.value = this.control.value;
//     //   this.control.registerOnChange(val => this.value = val);
//     // }

//     if (changes['selectable']) {
//       const v = changes.selectable.currentValue;
//       this.selectable = v === true || v === 'true' || v === '';
//     }

//     // if (changes['filterTerms']) { this.handler.filterTerms = this.filterTerms; this.handler.onChange() }
//   }

//   ngOnDestroy() {
//     this.adapter.destroy();
//   }

//   hierarchy: HierarchyByChildren | HeirarchyByParent;

//   hasChild = (_: number, _nodeData: HierarchicalNode) => _nodeData.expandable;
//   itemSelectionToggle(node: HierarchicalNode): void {
//     if (!this.dataNodes) return;
//     const currentNodeSelected = node.selected;
//     if (!this.multiple) this.dataNodes.forEach(n => n.selected = false);

//     node.selected = !currentNodeSelected;
//     if (node.selected) this.checkParentsSelection(node);
//     else this.getDescendants(node).forEach(d => d.selected = node.selected);

//     const allSelectd = this.dataNodes.filter(n => n.selected);
//     const result: any[][] = [];
//     if (allSelectd.length) result.push([]);

//     let [currentLevel, i] = [0, -1];
//     while (allSelectd.length) {
//       const n = allSelectd.shift();
//       if (n.level > currentLevel) result[i].push(n);
//       else {
//         result[i + 1] = result[i]?.filter(x => x.level < n.level) || [];
//         ++i;
//         result[i].push(n);
//       }
//       currentLevel = n.level;
//     }

//     //todo what is the value??
//     // const value = result.map(x => x.map(y => y.normalized.value));
//     // this.value = this.multiple ? value : value[0];
//   }
//   checkParentsSelection(node: HierarchicalNode): void {
//     let parent: HierarchicalNode | null = this.getParentNode(node);
//     if (!parent) return;

//     const children = this.getDescendants(parent).filter(d => d.level === parent.level + 1);
//     let selected: boolean;

//     if (Array.isArray(children)) {
//       selected = children.some(c => c.selected);
//       if (selected != parent.selected) {
//         parent.selected = selected;
//         if (selected) this.checkParentsSelection(parent);
//       }
//     }
//   }
//   getParentNode(node: HierarchicalNode): HierarchicalNode | null {
//     const currentLevel = node.level;
//     if (currentLevel < 1) return null; //root
//     const startIndex = this.dataNodes.indexOf(node) - 1;
//     for (let i = startIndex; i >= 0; i--) {
//       const currentNode = this.dataNodes[i];
//       if (currentNode.level < currentLevel) return currentNode;
//     }
//     return null;
//   }

//   // @Input() control: FormControl;
//   // _onChangeHandlers: ((value: any[]) => void)[] = [];
//   // _onTouchHandlers: (() => void)[] = [];
//   // onChange(_value: any[]) {
//   //   this._onChangeHandlers.forEach(h => h(_value));
//   //   this.valueChanged.emit(_value);
//   // };
//   // onTouch() { this._onTouchHandlers.forEach(h => h()) };

//   // @Output() valueChanged = new EventEmitter<any[]>();
//   // private _value: any[];
//   // @Input()
//   // get value(): any[] { return this._value }
//   // set value(value: any[]) {
//   //   this.writeValue(value);
//   // }

//   // writeValue(value: any[]): void {
//   //   if (this._value === value) return;
//   //   this._value = value;
//   //   this.control?.setValue(value);
//   //   this.onChange(this._value);
//   // }

//   // registerOnChange(fn: (value: any[]) => void): void { this._onChangeHandlers.push(fn); }
//   // registerOnTouched(fn: () => void): void { this._onTouchHandlers.push(fn); }
//   // setDisabledState?(isDisabled: boolean): void {
//   //   if (isDisabled && this.control.enabled) {
//   //     this.control.disable();
//   //   }
//   //   else if (isDisabled === false && this.control.disabled) {
//   //     this.control.enable();
//   //   }
//   // }

// }
