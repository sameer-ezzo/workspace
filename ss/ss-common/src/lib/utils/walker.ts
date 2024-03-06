import * as fs from 'fs'
import * as path from 'path'

export async function walk(dir: string, predicate: ((file: string) => boolean)): Promise<string[]> {
    return new Promise<string[]>(async (resolve, reject) => {
        const results: string[] = [];

        try {
            const list = fs.readdirSync(dir);
            var pending = list.length;
            if (!pending) return resolve(results);

            for (const f of list) {
                const file = path.resolve(dir, f);
                const stat = fs.statSync(file);

                if (stat && stat.isDirectory()) {
                    const subs = await walk(file, predicate);
                    results.push(...subs)
                    if (!--pending) return resolve(results);

                } else {
                    if (predicate(file)) results.push(file);
                    if (!--pending) return resolve(results);
                }
            }
        } catch (error) {
            return reject(error);
        }
    })
}


export function walkSync(dir: string, predicate: ((file: string) => boolean)): string[] {

    const results: string[] = [];

    const list = fs.readdirSync(dir);
    var pending = list.length;
    if (!pending) return results;

    for (const f of list) {
        const file = path.resolve(dir, f);
        const stat = fs.statSync(file);

        if (stat && stat.isDirectory()) {
            const subs = walkSync(file, predicate);
            results.push(...subs)

            if (!--pending) return results;

        } else {
            if (predicate(file)) results.push(file);
            if (!--pending) return results;
        }
    }

    return results


}