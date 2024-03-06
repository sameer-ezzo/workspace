import { Field } from "../types";
import { CollectStyle } from "./types";


export function getGoogleFontUri(familyName: string) {
    const pos = familyName.indexOf(':');
    if (pos > 0) familyName = familyName.substring(0, pos);
    return `https://fonts.googleapis.com/css?family=${familyName.replace(' ', '+')}&display=swap`;

}

export function loadFontFromUri(family: string, fontUri?: string) {
    let link = document.getElementById(`${family}-fontlink`);
    if (!link) {
        link = document.createElement('link');
        link.id = `${family}-fontlink`;
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', fontUri);
        document.head.appendChild(link);
    } else {
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', fontUri);
    }



}


export type FormPage = { from: number, to: number, fields: Field[] }

function _isNaturalyHidden(field: Field): boolean {
    return field.type === "page-breaker" || (field.type === 'field' && field.input === 'hidden');
}

export function fieldsArrayToPages(collectStyle: CollectStyle, fields: Field[]): FormPage[] {
    let pages: FormPage[] = [];

    if (collectStyle === '1by1')
        pages = fields.filter(f => !_isNaturalyHidden(f))
            .map((f, i) => { return { from: i, to: i, fields: [f] } })
    else if (collectStyle === 'linear') {
        const fs = fields.filter(p => p.type != 'page-breaker');
        pages = [{ from: 0, to: fs.length, fields: fs }];
    }
    else {
        const pageBreakerIndexs = fields.filter((f: any) => f.type === 'page-breaker')
            .map(f => fields.indexOf(f));

        if (pageBreakerIndexs.length > 0) {
            let i = 0;
            for (i; i < pageBreakerIndexs.length; i++) {
                const pageIndex = pageBreakerIndexs[i];
                const from = i === 0 ? i : pageBreakerIndexs[i - 1] + 1;
                const to = pageIndex;
                pages.push({ from: from, to: to, fields: fields.slice(from, to) });
            }
            pages.push({
                from: pageBreakerIndexs[i - 1] + 1,
                to: fields.length,
                fields: fields.slice(pageBreakerIndexs[i - 1] + 1, fields.length)
            });
        }
        else pages.push({ from: 0, to: fields.length, fields: fields.slice(0, fields.length) });

    }

    return pages;
}
