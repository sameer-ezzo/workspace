// create function to load js file async and defer
const scriptCache = new Map<string, Promise<HTMLScriptElement>>();

export function loadScript(src: string, async = true, defer = true): Promise<HTMLScriptElement> {
    let cachedPromise = scriptCache.get(src);

    if (cachedPromise) {
        return cachedPromise;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.defer = defer;

    cachedPromise = new Promise<HTMLScriptElement>((resolve, reject) => {
        script.onload = () => resolve(script);
        script.onerror = (error) => reject(error);
    });

    document.body.appendChild(script);
    scriptCache.set(src, cachedPromise);

    return cachedPromise;
}
