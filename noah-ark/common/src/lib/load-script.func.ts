const scripts = new Map<string, Promise<HTMLScriptElement>>();
export async function loadScript(doc: Document, src: string, options: { async?: boolean; defer?: boolean } = { async: true, defer: true }): Promise<HTMLScriptElement> {
    if (scripts.has(src)) return scripts.get(src)!;

    const script = doc.createElement("script");
    script.src = src;
    script.async = options?.async === true;
    script.defer = options?.defer === true;

    const loadPromise = new Promise<HTMLScriptElement>((resolve, reject) => {
        script.onload = () => {
            scripts.set(src, Promise.resolve(script)); // Cache the resolved promise no need to reload
            resolve(script);
        };
        script.onerror = (error) => reject(error);
    });
    doc.body.appendChild(script);
    scripts.set(src, loadPromise);

    return loadPromise;
}
