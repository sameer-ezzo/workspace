// create function to load js file async and defer
const scriptCache = new Map<string, Promise<HTMLScriptElement>>();

export function loadScript(doc, src: string, async = true, defer = true): Promise<HTMLScriptElement> {
    let cachedPromise = scriptCache.get(src);

    if (cachedPromise) {
        return cachedPromise;
    }

    const script = doc.createElement("script");
    script.src = src;
    script.async = async;
    script.defer = defer;

    cachedPromise = new Promise<HTMLScriptElement>((resolve, reject) => {
        script.onload = () => resolve(script);
        script.onerror = (error) => reject(error);
    });

    doc.head.appendChild(script);
    scriptCache.set(src, cachedPromise);

    return cachedPromise;
}
