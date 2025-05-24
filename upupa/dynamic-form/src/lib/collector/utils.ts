import { FormGroup } from "@angular/forms";

import { Field } from "../types";
import { CollectStyle } from "./types";

export function getGoogleFontUri(familyName: string) {
    const pos = familyName.indexOf(":");
    if (pos > 0) familyName = familyName.substring(0, pos);
    return `https://fonts.googleapis.com/css?family=${familyName.replace(" ", "+")}&display=swap`;
}

export function loadFontFromUri(doc: Document, family: string, fontUri?: string) {
    let link = doc.getElementById(`${family}-fontlink`);
    if (!link) {
        link = doc.createElement("link");
        link.id = `${family}-fontlink`;
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("href", fontUri);
        doc.head.appendChild(link);
    } else {
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("href", fontUri);
    }
}

export type FormPage = { from: number; to: number; fields: FormGroup["controls"] };

function _isNaturallyHidden(f: Field): boolean {
    return f.input === "page-breaker" || f.input === "hidden";
}

export function fieldsArrayToPages(collectStyle: CollectStyle, fields: FormGroup["controls"]): FormPage[] {
    let pages: FormPage[] = [];
    if (!fields) return pages;
    const fs = Object.values(fields);
    if (collectStyle === "1by1")
        pages = fs
            .filter((f) => !_isNaturallyHidden(f["fieldRef"].field))
            .map((f, i) => {
                return { from: i, to: i, fields: { [f["name"]]: f } };
            });
    else if (collectStyle === "linear") {
        const _fs = fs
            .filter((f) => f["fieldRef"].input !== "page-breaker")
            .reduce((acc, f) => {
                acc[f["name"]] = f;
                return acc;
            }, {});
        pages = [{ from: 0, to: fs.length, fields: _fs }];
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
