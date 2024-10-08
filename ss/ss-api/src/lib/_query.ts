

export function _query(path: string, query: any, baseUrl = '') {
    path = decodeURIComponent(path).substring(baseUrl.length);

    //Q
    query = query || {};
    let queryArray: { key: string; value: string; }[] = [];
    query = Object.keys(query).map(key => { return { key, value: query[key] }; });
    query.forEach(x => {
        if (Array.isArray(x.value)) x.value.forEach((y: any) => queryArray.push({ key: x.key, value: y }));
        else queryArray.push(x);
    });
    queryArray = queryArray.map(x => { return { key: decodeURIComponent(x.key), value: decodeURIComponent(x.value) }; });

    const q: Record<string, any>[] = queryArray.map(x => { return { [x.key]: x.value }; });
    return { path, q };
}
