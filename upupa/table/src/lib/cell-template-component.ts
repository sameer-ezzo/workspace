import { KeyValue } from "@angular/common";
import { Component, computed, input, Input, InputSignal, SimpleChanges } from "@angular/core";
import { ColumnDescriptor } from "./types";
import { NormalizedItem } from "@upupa/data";
import { DynamicComponent } from "@upupa/common";
import { DynamicPipe } from "./dynamic.pipe";
import { ActivatedRoute, Params, QueryParamsHandling, RouterLink, RouterModule, UrlTree } from "@angular/router";

export interface ITableCellTemplate<TValue = any, TRow = any> {
    value?: InputSignal<TValue>;
    element?: InputSignal<{ item: TRow }>;
    item?: InputSignal<TRow>;
    dataIndex?: InputSignal<number>;
    column?: InputSignal<KeyValue<string, ColumnDescriptor>>;
}

@Component({
    standalone: true,
    selector: "cell-template",
    imports: [DynamicPipe],
    template: `
        @if (column().value.pipe) {
            @if (column().value.pipe["pipe"]) {
                <div [innerHTML]="value() | dynamic: column().value.pipe['pipe'] : column().value.pipe['args']"></div>
            } @else {
                <div [innerHTML]="value() | dynamic: column().value.pipe"></div>
            }
        } @else {
            {{ value() }}
        }
    `,
})
export class DefaultTableCellTemplate<TValue = any, TRow = any> implements ITableCellTemplate<TValue, TRow> {
    value = input.required<TValue>();
    element = input.required<NormalizedItem<TRow>>();
    item = input.required<TRow>();
    column = input<KeyValue<string, ColumnDescriptor>>();
}

export function objectCell<T = unknown>(textProp: keyof T = "title" as any, href?: (x: T) => string): DynamicComponent {
    return {
        component: ObjectCellTemplate,
        inputs: {
            textProp,
            href,
        },
    };
}

export type LinkRouterCellInputs = {
    target?: string | undefined;
    queryParams?: Params | null | undefined;
    fragment?: string | undefined;
    queryParamsHandling?: QueryParamsHandling | null | undefined;
    state?: { [k: string]: any } | undefined;
    info?: unknown;
    relativeTo?: ActivatedRoute | null | undefined;
    preserveFragment: boolean;
    skipLocationChange: boolean;
    replaceUrl: boolean;
    routerLink: string | any[] | UrlTree | null | undefined;
    routerLinkActive: string | string[] | undefined;
    routerLinkActiveOptions?: { exact: boolean; ignoreQueryParams: boolean } | undefined;
};
@Component({
    standalone: true,
    imports: [RouterModule],

    template: `
        <a
            [routerLink]="routerLink().routerLink"
            [target]="routerLink().target"
            [queryParams]="routerLink().queryParams"
            [fragment]="routerLink().fragment"
            [queryParamsHandling]="routerLink().queryParamsHandling"
            [state]="routerLink().state"
            [info]="routerLink().info"
            [relativeTo]="routerLink().relativeTo"
            [preserveFragment]="routerLink().preserveFragment"
            [skipLocationChange]="routerLink().skipLocationChange"
            [replaceUrl]="routerLink().replaceUrl"
            [routerLinkActive]="routerLink().routerLinkActive ?? ''"
            [routerLinkActiveOptions]="routerLink().routerLinkActiveOptions ?? { exact: true, ignoreQueryParams: true }"
            >{{ text() }}</a
        >
    `,
})
export class RouterLinkCellTemplate<TValue = unknown> extends DefaultTableCellTemplate<TValue> {
    textFn = input<(ref: RouterLinkCellTemplate) => string>();
    routerLinkFn = input<(ref: RouterLinkCellTemplate) => LinkRouterCellInputs>();
    text = computed(() => (this.textFn ? this.textFn()(this) : this.value()) ?? "");
    routerLink = computed<LinkRouterCellInputs>(() => (this.routerLinkFn()(this) ?? {}) as LinkRouterCellInputs);
}

@Component({
    standalone: true,
    imports: [RouterModule],
    template: `
        @let _href = href() ? href()(value()) : null;
        @if (_href) {
            <a [routerLink]="_href">{{ value()?.[textProp()] }}</a>
        } @else {
            {{ value()?.[textProp()] }}
        }
    `,
})
export class ObjectCellTemplate<TValue = unknown> implements ITableCellTemplate<TValue> {
    textProp = input.required<keyof TValue>();
    href = input<(value: TValue) => string>();
    value = input<TValue>();
    ngOnChanges(changes: SimpleChanges) {
        console.log(changes);
    }
}

export function nameCell() {
    return objectCell("name");
}
export function titleCell() {
    return objectCell("title");
}
