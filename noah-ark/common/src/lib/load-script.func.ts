export function loadScript(doc, src: string, async = true, defer = true): Promise<HTMLScriptElement> {
    const script = doc.createElement("script");
    script.src = src;
    script.async = async;
    script.defer = defer;

    const loadPromise = new Promise<HTMLScriptElement>((resolve, reject) => {
        script.onload = () => resolve(script);
        script.onerror = (error) => reject(error);
    });

    doc.head.appendChild(script);

    return loadPromise;
}
