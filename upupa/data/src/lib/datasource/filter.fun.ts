import { JsonPointer } from "@noah-ark/json-patch";
import { Key, NormalizedItem, PageDescriptor, SortDescriptor, Term, FilterDescriptor } from "./model";

export function filterNormalized<T>(normalized: NormalizedItem<T>[], filter: FilterDescriptor, sort: SortDescriptor, page: PageDescriptor, terms: Key<T>): NormalizedItem<T>[] {
    let result = normalized;

    //FILTER
    const term = filter?.search?.toLocaleLowerCase();

    if (term) {
        result = normalized.filter((norm) => {
            const item = norm.item;
            if (norm.defaultSearchTerm === undefined) {
                const t = Array.isArray(terms) ? terms : [terms];
                const defaultSearchTerm =
                    typeof item !== "object"
                        ? item + ""
                        : t
                              .map((k) => getByPath(item, k as string))
                              .join("{}")
                              .trim();
                norm.defaultSearchTerm = defaultSearchTerm.toLocaleLowerCase();
            }
            return norm.defaultSearchTerm?.indexOf(term) > -1;
        });
    }

    //SORT
    if (sort?.active && sort.direction) {
        const dir = sort.direction === "desc" ? -1 : 1;
        result = result.sort((a, b) => {
            const x = getByPath(a.item, sort.active);
            const y = getByPath(b.item, sort.active);
            return compare(x, y) * dir;
        });
    }

    //PAGINATION
    if (page?.pageSize) {
        page.length = result.length; //TOTAL
        const from = page.pageIndex * page.pageSize;
        const to = (page.pageIndex + 1) * page.pageSize;
        result = result.filter((_, i) => i >= from && i < to);
    }

    return result;
}

export function filter<T>(all: T[], filter: FilterDescriptor, sort: SortDescriptor, page: PageDescriptor, terms: Term<T>[]): T[] {
    let result = all;
    if (!result) return [];
    //FILTER
    const term = filter?.search?.toLocaleLowerCase();
    if (term) {
        result = all.filter((item) => {
            const itemTerm: string =
                typeof item !== "object"
                    ? item + ""
                    : terms
                          .map((t) => getByPath(item, t.field as string))
                          .join("{}")
                          .trim();
            return itemTerm.toLocaleLowerCase().indexOf(term) > -1;
        });
    }

    //SORT
    if (sort && sort.active && sort.direction) {
        const dir = sort.direction === "desc" ? -1 : 1;
        result = result.sort((a, b) => {
            const x = getByPath(a, sort.active);
            const y = getByPath(b, sort.active);
            return compare(x, y) * dir;
        });
    }

    //PAGINATION
    if (page?.pageSize) {
        page.length = result.length; //TOTAL
        const from = page.pageIndex * page.pageSize;
        const to = (page.pageIndex + 1) * page.pageSize;
        result = result.filter((_, i) => i >= from && i < to);
    }

    return result;
}

export function getByPath(obj: any, path: string) {
    return JsonPointer.get(obj, path, ".");
}

export function compare(a, b): number {
    if (a?.localeCompare) return a.localeCompare(b);
    if (a > b) return 1;
    else if (a < b) return -1;
    else return 0;
}
