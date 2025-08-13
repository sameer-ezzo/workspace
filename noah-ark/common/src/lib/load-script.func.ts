const scripts = new Map<string, Promise<HTMLScriptElement>>();
export async function loadScript(
    doc: Document,
    src: string,
    options: { type?: "module" | "text/javascript"; async?: boolean; defer?: boolean } = { type: "text/javascript", async: true, defer: true },
): Promise<HTMLScriptElement> {
    if (scripts.has(src)) return scripts.get(src)!;

    const script = doc.createElement("script");
    script.src = src;
    script.type = options.type === "module" || options.type === "text/javascript" ? options.type : "text/javascript";
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

function randId() {
    return Math.round(Math.random() * 1000).toString();
}

export async function embedScript(
    doc: Document,
    content: string,
    options: { id: string; type?: "module" | "text/javascript"; async?: boolean; defer?: boolean } = { id: randId(), async: true, defer: true },
): Promise<HTMLScriptElement> {
    const id = options.id || randId();
    if (scripts.has(id)) return scripts.get(id);

    const script = doc.createElement("script");
    script.textContent = content;
    script.type = options.type === "module" || options.type === "text/javascript" ? options.type : "text/javascript";
    script.async = options?.async === true;
    script.defer = options?.defer === true;

    const loadPromise = new Promise<HTMLScriptElement>((resolve, reject) => {
        script.onload = () => {
            scripts.set(id, Promise.resolve(script)); // Cache the resolved promise no need to reload
            resolve(script);
        };
        script.onerror = (error) => reject(error);
    });
    doc.body.appendChild(script);
    scripts.set(id, loadPromise);

    return loadPromise;
}
