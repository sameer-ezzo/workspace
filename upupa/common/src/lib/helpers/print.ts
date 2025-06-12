export type PrintElementOptions = {
    title?: string; // Title for the print page
    copyStyles?: boolean; // Whether to copy styles from the main document
    customCSS?: string; // Custom CSS to inject
    pageSize?: "A4" | "Letter" | "Legal"; // Page size control
    orientation?: "portrait" | "landscape"; // Page orientation
    margins?: string; // CSS margin values (e.g., '1in', '2.5cm')
    cleanupDelay?: number; // Configurable cleanup delay in milliseconds
    onBeforePrint?: () => void | Promise<void>; // Callback before printing
    onAfterPrint?: () => void | Promise<void>; // Callback after printing
    timeout?: number; // Timeout for print operation in milliseconds
    waitForImages?: boolean; // Wait for images to load before printing
    removeAfterPrint?: boolean; // Whether to remove iframe after printing
};

/**
 * Prints a specific HTML element or string using a hidden iframe approach.
 *
 * This function creates a hidden iframe, copies the target element's content along with
 * all stylesheets and styles to the iframe, and then triggers the browser's print dialog
 * from within the iframe context. This approach avoids opening new tabs/windows while
 * maintaining proper styling for printed content.
 *
 * @param doc - The document object (typically `document` or injected DOCUMENT token)
 * @param el - The HTML element or string to print. Can be an HTMLElement, HTML string, or defaults to document.body
 * @param options - Configuration options for printing
 * @param options.title - The title for the print page. Defaults to 'Print Page'
 * @param options.copyStyles - Whether to copy styles from the main document. Defaults to true
 * @param options.customCSS - Custom CSS to inject into the print document
 * @param options.pageSize - Page size for printing ('A4', 'Letter', 'Legal')
 * @param options.orientation - Page orientation ('portrait', 'landscape')
 * @param options.margins - CSS margin values (e.g., '1in', '2.5cm')
 * @param options.cleanupDelay - Delay before removing iframe in milliseconds. Defaults to 1000
 * @param options.onBeforePrint - Callback executed before printing
 * @param options.onAfterPrint - Callback executed after printing
 * @param options.timeout - Timeout for the entire print operation in milliseconds. Defaults to 30000
 * @param options.waitForImages - Whether to wait for images to load before printing. Defaults to true
 * @param options.removeAfterPrint - Whether to remove iframe after printing. Defaults to true
 *
 * @returns Promise that resolves when printing is complete or rejects on error
 *
 * @example
 * ```typescript
 * // Print a specific container element with custom options
 * const container = document.querySelector('#payslip-container');
 * await printElement(document, container, {
 *   title: 'Employee Payslip',
 *   pageSize: 'A4',
 *   orientation: 'portrait',
 *   margins: '1in',
 *   customCSS: '@media print { .no-print { display: none; } }'
 * });
 *
 * // Print HTML string with callbacks
 * const htmlString = '<div><h1>Custom Content</h1></div>';
 * await printElement(document, htmlString, {
 *   title: 'Custom Print',
 *   onBeforePrint: () => console.log('Starting print...'),
 *   onAfterPrint: () => console.log('Print completed!')
 * });
 *
 * // Print with timeout and error handling
 * try {
 *   await printElement(document, element, { timeout: 5000 });
 * } catch (error) {
 *   console.error('Print failed:', error);
 * }
 * ```
 *
 * @remarks
 * - The iframe is positioned off-screen and removed after printing by default
 * - All CSS stylesheets and inline styles are copied when copyStyles is true
 * - The function handles HTMLElement, HTML strings, and full body printing
 * - Print dialog appears without opening new tabs or windows
 * - Supports flexible configuration through the options parameter
 * - Returns a Promise for better async handling and error management
 * - Includes timeout protection and resource loading management
 *
 * @throws {Error} When iframe creation fails or timeout is reached
 * @since 0.0.4
 */
export function printElement(doc: Document, el: string | HTMLElement = doc.body, options: PrintElementOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!el) {
            reject(new Error("No element provided for printing"));
            return;
        }

        // Set default options
        const config = {
            title: "Print Page",
            copyStyles: true,
            cleanupDelay: 1000,
            timeout: 30000,
            waitForImages: true,
            removeAfterPrint: true,
            ...options,
        };

        let iframe: HTMLIFrameElement | null = null;
        let timeoutId = null;
        let isResolved = false;

        // Cleanup function
        const cleanup = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            if (iframe && config.removeAfterPrint && iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
                iframe = null;
            }
        };

        // Timeout handler
        const handleTimeout = () => {
            if (!isResolved) {
                isResolved = true;
                cleanup();
                reject(new Error(`Print operation timed out after ${config.timeout}ms`));
            }
        };

        // Success handler
        const handleSuccess = async () => {
            if (!isResolved) {
                isResolved = true;
                try {
                    if (config.onAfterPrint) {
                        await config.onAfterPrint();
                    }
                    setTimeout(() => {
                        cleanup();
                        resolve();
                    }, config.cleanupDelay);
                } catch (error) {
                    cleanup();
                    reject(error);
                }
            }
        };

        // Error handler
        const handleError = (error: Error) => {
            if (!isResolved) {
                isResolved = true;
                cleanup();
                reject(error);
            }
        };

        try {
            // Set timeout
            timeoutId = setTimeout(handleTimeout, config.timeout);

            // Execute onBeforePrint callback
            Promise.resolve(config.onBeforePrint?.())
                .then(async () => {
                    const styleLinks = doc.querySelectorAll('link[rel="stylesheet"]');
                    const styles = doc.querySelectorAll("style");

                    // Create hidden iframe
                    iframe = doc.createElement("iframe");
                    iframe.style.position = "absolute";
                    iframe.style.left = "-9999px";
                    iframe.style.width = "0";
                    iframe.style.height = "0";
                    iframe.style.border = "none";
                    iframe.style.visibility = "hidden";

                    doc.body.appendChild(iframe);

                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (!iframeDoc) {
                        handleError(new Error("Failed to access iframe document"));
                        return;
                    }

                    // Generate HTML content
                    let html = "";
                    if (typeof el === "string") {
                        html = el;
                    } else {
                        const isBodyElement = doc.body === el;
                        if (isBodyElement) {
                            html = `<!DOCTYPE html><html><head></head><body>${el.innerHTML}</body></html>`;
                        } else {
                            html = `<!DOCTYPE html><html><head></head><body>${el.outerHTML}</body></html>`;
                        }
                    }

                    // Write initial HTML
                    iframeDoc.open();
                    iframeDoc.write(html);

                    // Set title
                    if (config.title) {
                        iframeDoc.title = config.title;
                        const titleElement = iframeDoc.createElement("title");
                        titleElement.textContent = config.title;
                        iframeDoc.head.appendChild(titleElement);
                    }

                    // Add viewport meta tag for better printing
                    const viewport = iframeDoc.createElement("meta");
                    viewport.name = "viewport";
                    viewport.content = "width=device-width, initial-scale=1.0";
                    iframeDoc.head.appendChild(viewport);

                    // Copy styles if enabled
                    if (config.copyStyles) {
                        // Copy external stylesheets
                        const linkPromises: Promise<void>[] = [];
                        styleLinks.forEach((link) => {
                            const newLink = iframeDoc.createElement("link");
                            newLink.rel = "stylesheet";
                            newLink.href = link.getAttribute("href") || "";
                            newLink.type = link.getAttribute("type") || "text/css";

                            if (config.waitForImages) {
                                const linkPromise = new Promise<void>((linkResolve) => {
                                    newLink.onload = () => linkResolve();
                                    newLink.onerror = () => linkResolve(); // Continue even if stylesheet fails
                                    setTimeout(() => linkResolve(), 5000); // Fallback timeout
                                });
                                linkPromises.push(linkPromise);
                            }

                            iframeDoc.head.appendChild(newLink);
                        });

                        // Copy inline styles
                        styles.forEach((style) => {
                            const newStyle = iframeDoc.createElement("style");
                            newStyle.textContent = style.textContent || "";
                            iframeDoc.head.appendChild(newStyle);
                        });
                    }

                    // Add print-specific CSS
                    const printStyles = iframeDoc.createElement("style");
                    printStyles.textContent = `
                    @media print {
                        @page {
                            ${config.pageSize ? `size: ${config.pageSize}` : ""}
                            ${config.orientation ? `orientation: ${config.orientation}` : ""}
                            ${config.margins ? `margin: ${config.margins}` : ""}
                        }
                        html, body {
                            margin: 0;
                            padding: 0;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        * {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                    }
                    ${config.customCSS || ""}
                `;
                    iframeDoc.head.appendChild(printStyles);

                    iframeDoc.close();

                    // Wait for resources to load if enabled
                    const waitForResources = async () => {
                        if (config.waitForImages && config.copyStyles) {
                            await Promise.all([
                                // Wait for stylesheets
                                ...Array.from(styleLinks).map(
                                    (link) =>
                                        new Promise<void>((resolve) => {
                                            const linkElement = link as HTMLLinkElement;
                                            if (linkElement.sheet) {
                                                resolve();
                                            } else {
                                                const timeout = setTimeout(() => resolve(), 2000);
                                                link.addEventListener("load", () => {
                                                    clearTimeout(timeout);
                                                    resolve();
                                                });
                                                link.addEventListener("error", () => {
                                                    clearTimeout(timeout);
                                                    resolve();
                                                });
                                            }
                                        }),
                                ),
                                // Wait for images
                                ...Array.from(iframeDoc.images).map(
                                    (img) =>
                                        new Promise<void>((resolve) => {
                                            if (img.complete) {
                                                resolve();
                                            } else {
                                                const timeout = setTimeout(() => resolve(), 5000);
                                                img.addEventListener("load", () => {
                                                    clearTimeout(timeout);
                                                    resolve();
                                                });
                                                img.addEventListener("error", () => {
                                                    clearTimeout(timeout);
                                                    resolve();
                                                });
                                            }
                                        }),
                                ),
                            ]);
                        }
                    };

                    // Handle iframe load
                    iframe.onload = async () => {
                        try {
                            await waitForResources();

                            const iframeWindow = iframe?.contentWindow;
                            if (!iframeWindow) {
                                handleError(new Error("Failed to access iframe window"));
                                return;
                            }

                            // Focus and print
                            iframeWindow.focus();
                            iframeWindow.print();

                            // Handle success
                            await handleSuccess();
                        } catch (error) {
                            handleError(error instanceof Error ? error : new Error("Unknown error during printing"));
                        }
                    };

                    iframe.onerror = () => {
                        handleError(new Error("Iframe failed to load"));
                    };
                })
                .catch(handleError);
        } catch (error) {
            handleError(error instanceof Error ? error : new Error("Unknown error occurred"));
        }
    });
}

/**
 * Legacy synchronous version of printElement for backward compatibility.
 *
 * @deprecated Use the Promise-based printElement function instead
 * @param doc - The document object
 * @param el - The HTML element or string to print
 * @param title - The title for the print page
 */
export function printElementSync(doc: Document, el: string | HTMLElement = doc.body, title: string = "Print Page"): void {
    printElement(doc, el, { title, copyStyles: true }).catch(console.error);
}
