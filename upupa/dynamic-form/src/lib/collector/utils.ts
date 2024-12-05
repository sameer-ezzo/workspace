import { FormGraph } from '../dynamic-form.component';
import { Field } from '../types';
import { CollectStyle } from './types';

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

export type FormPage = { from: number; to: number; fields: FormGraph };

function _isNaturallyHidden(f: Field): boolean {
    return f.input === 'page-breaker' ||  f.input === 'hidden';
}

export function fieldsArrayToPages(collectStyle: CollectStyle, fields: FormGraph): FormPage[] {
    let pages: FormPage[] = [];
    if(!fields) return pages;
    const fs = Array.from(fields.entries());
    if (collectStyle === '1by1')
        pages = fs
            .filter(([name, f]) => !_isNaturallyHidden(f.field))
            .map((f, i) => {
                return { from: i, to: i, fields: new Map([[f[0], f[1]]]) };
            });
    else if (collectStyle === 'linear') {
        const _fs = fs.filter(([name, f]) => f.field.input !== 'page-breaker');
        pages = [{ from: 0, to: fs.length, fields: new Map(_fs) }];
    } else {
        // const pageBreakerIndexes = fs.filter(([name, f]) => f.type === 'page-breaker').map(([name, f]) => fs.indexOf(f));
        // if (pageBreakerIndexes.length > 0) {
        //     let i = 0;
        //     for (i; i < pageBreakerIndexes.length; i++) {
        //         const pageIndex = pageBreakerIndexes[i];
        //         const from = i === 0 ? i : pageBreakerIndexes[i - 1] + 1;
        //         const to = pageIndex;
        //         pages.push({ from: from, to: to, fields: fields.slice(from, to) });
        //     }
        //     pages.push({
        //         from: pageBreakerIndexes[i - 1] + 1,
        //         to: fields.length,
        //         fields: fields.slice(pageBreakerIndexes[i - 1] + 1, fields.length),
        //     });
        // } else pages.push({ from: 0, to: fields.length, fields: fields.slice(0, fields.length) });
    }

    return pages;
}
