const scripts = new Map<string, Promise<HTMLScriptElement>>();
export function loadScript(doc, src: string, options: { async?: boolean; defer?: boolean } = { async: true, defer: true }): Promise<HTMLScriptElement> {
    const script = doc.createElement("script");
    script.src = src;
    script.async = options?.async === true;
    script.defer = options?.defer === true;

    if (scripts.has(src)) return scripts.get(src);

    const loadPromise = new Promise<HTMLScriptElement>((resolve, reject) => {
        script.onload = () => resolve(script);
        script.onerror = (error) => reject(error);
    });
    doc.head.appendChild(script);

    scripts.set(src, loadPromise);

    return loadPromise;
}
