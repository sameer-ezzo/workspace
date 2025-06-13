import { delay } from "@noah-ark/common";
import { DynamicTemplate } from "../dynamic-component";

// wait till network idle time is reached for the iframe
async function waitForNetworkIdle(doc: Document | HTMLIFrameElement, config: { timeout: number } = { timeout: 30000 }) {
    if (!doc || (doc instanceof HTMLIFrameElement && !doc.contentWindow)) throw new Error("Iframe or contentWindow is not available");

    const iframeWindow = doc instanceof HTMLIFrameElement ? doc.contentWindow : window;
    const iframeDoc = iframeWindow.document;
    let consecutiveIdleChecks = 0;
    const requiredIdleChecks = 3; // Number of consecutive idle checks required
    const idleCheckInterval = 200; // ms between checks
    const startTime = Date.now();

    return new Promise<void>((resolve, reject) => {
        const checkNetworkIdle = () => {
            const currentTime = Date.now();
            if (currentTime - startTime > config.timeout) {
                reject(new Error(`Network idle timeout reached after ${config.timeout}ms`));
                return;
            }

            // Check document ready state
            const readyState = iframeDoc.readyState;
            console.log(`Network idle check - ReadyState: ${readyState}, Idle checks: ${consecutiveIdleChecks}`);

            // Check for active network requests using Performance API if available
            let hasActiveRequests = false;
            try {
                const performance = iframeWindow.performance;
                if (performance && performance.getEntriesByType) {
                    const resources = performance.getEntriesByType("resource");
                    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;

                    // Check if any resources are still loading
                    const recentResources = resources.filter((resource) => {
                        const resourceTime = resource.startTime + (navigation?.fetchStart || 0);
                        return currentTime - resourceTime < 1000; // Resources loaded in last second
                    });

                    hasActiveRequests = recentResources.some((resource) => {
                        const resourceTiming = resource as PerformanceResourceTiming;
                        return (
                            resourceTiming.responseEnd === 0 || // Still loading
                            resourceTiming.responseEnd - resourceTiming.responseStart < 50
                        ); // Very recent completion
                    });
                }
            } catch (error) {
                console.warn("Performance API check failed:", error);
            }

            // Check for pending images
            const images = Array.from(iframeDoc.images);
            const imagesLoading = images.some((img) => !img.complete);

            // Check for pending scripts and stylesheets
            const scripts = Array.from(iframeDoc.scripts);
            const stylesheets = Array.from(iframeDoc.querySelectorAll('link[rel="stylesheet"]'));
            const scriptsLoading = scripts.some((script) => {
                const scriptElement = script as any;
                return scriptElement.readyState && scriptElement.readyState === "loading";
            });
            const stylesheetsLoading = stylesheets.some((link) => {
                try {
                    return !(link as HTMLLinkElement).sheet;
                } catch {
                    return true;
                }
            });

            // Check if document is complete and no resources are actively loading
            const isIdle = readyState === "complete" && !hasActiveRequests && !imagesLoading && !scriptsLoading && !stylesheetsLoading;

            if (isIdle) {
                consecutiveIdleChecks++;
                console.log(`Network appears idle (${consecutiveIdleChecks}/${requiredIdleChecks})`);

                if (consecutiveIdleChecks >= requiredIdleChecks) {
                    console.log("Network idle achieved - all resources loaded");
                    resolve();
                    return;
                }
            } else {
                consecutiveIdleChecks = 0;
                console.log("Network still active:", {
                    readyState,
                    hasActiveRequests,
                    imagesLoading,
                    scriptsLoading,
                    stylesheetsLoading,
                });
            }

            // Continue checking
            setTimeout(checkNetworkIdle, idleCheckInterval);
        };

        // Start checking after initial delay to allow iframe to start loading
        setTimeout(checkNetworkIdle, 100);
    });
}

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
    baseUrl?: string; // Base URL for resolving relative paths (defaults to current origin)
};

/**
 * Creates and configures an iframe for printing with either HTML content or URL source
 * @param doc - The document object
 * @param config - Print configuration options
 * @param content - Object containing either html content or src URL
 * @returns Promise that resolves with the configured iframe
 */
async function createPrintIframe(
    doc: Document, 
    config: PrintElementOptions & { timeout: number }, 
    content: { html?: string; src?: string }
): Promise<HTMLIFrameElement> {
    const styleLinks = doc.querySelectorAll('link[rel="stylesheet"]');
    const styles = doc.querySelectorAll("style");

    // Create hidden iframe
    const iframe = doc.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.left = "-9999px";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.visibility = "hidden";

    doc.body.appendChild(iframe);

    if (content.src) {
        // Use iframe src for URL-based content
        iframe.src = content.src;
        
        // Wait for iframe to load the URL
        await new Promise<void>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Iframe failed to load URL within ${config.timeout}ms`));
            }, config.timeout);

            iframe.onload = () => {
                clearTimeout(timeoutId);
                resolve();
            };

            iframe.onerror = () => {
                clearTimeout(timeoutId);
                reject(new Error("Failed to load URL in iframe"));
            };
        });

        // Apply additional configurations to the loaded document
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) throw new Error("Failed to access iframe document");

        // Set title if provided
        if (config.title) {
            iframeDoc.title = config.title;
        }

        // Add custom CSS if provided
        if (config.customCSS) {
            const customStyle = iframeDoc.createElement("style");
            customStyle.textContent = config.customCSS;
            iframeDoc.head.appendChild(customStyle);
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
        `;
        iframeDoc.head.appendChild(printStyles);

    } else if (content.html) {
        // Use HTML content approach
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) throw new Error("Failed to access iframe document");

        // Write initial HTML
        iframeDoc.open();
        iframeDoc.write(content.html);

        // Add base URL to resolve relative paths automatically
        if (config.baseUrl) {
            const baseElement = iframeDoc.createElement("base");
            baseElement.href = config.baseUrl;
            iframeDoc.head.appendChild(baseElement);
        }

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
            styleLinks.forEach((link) => {
                const newLink = iframeDoc.createElement("link");
                newLink.rel = "stylesheet";
                newLink.href = link.getAttribute("href") || "";
                newLink.type = link.getAttribute("type") || "text/css";
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
    } else {
        throw new Error("Either html content or src URL must be provided");
    }

    return iframe;
}

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
 * @param options.baseUrl - Base URL for resolving relative paths. Defaults to window.location.origin
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
 * // Print with relative URLs automatically resolved
 * const htmlWithImages = '<div><img src="/assets/logo.png"><img src="./images/photo.jpg"></div>';
 * await printElement(document, htmlWithImages, {
 *   title: 'Content with Images',
 *   baseUrl: 'https://myapp.com' // Optional: override default base URL
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
export async function printElement(doc: Document, el: string | HTMLElement = doc.body, options: PrintElementOptions = {}) {
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
        }
        return Promise.reject<void>(new Error(`Print operation timed out after ${config.timeout}ms`));
    };

    // Success handler
    const handleSuccess = async () => {
        if (!isResolved) {
            isResolved = true;
            try {
                if (config.onAfterPrint) {
                    await config.onAfterPrint();
                }
                await delay(config.cleanupDelay || 0);
                cleanup();
                return Promise.resolve();
            } catch (error) {
                cleanup();
                return Promise.reject<void>(error);
            }
        }
    };

    // Error handler
    const handleError = (error: Error) => {
        if (!isResolved) {
            isResolved = true;
            cleanup();
        }
        return Promise.reject<void>(error);
    };

    if (!el) return handleError(new Error("No element provided to print"));

    // Set default options
    const config = {
        title: "Print Page",
        copyStyles: true,
        cleanupDelay: 1000,
        timeout: 30000,
        waitForImages: true,
        removeAfterPrint: true,
        baseUrl: typeof window !== "undefined" ? window.location.origin : undefined,
        ...options,
    };

    let iframe: HTMLIFrameElement | null = null;
    let timeoutId = null;
    let isResolved = false;

    try {
        // Set timeout
        timeoutId = setTimeout(handleTimeout, config.timeout);

        // Generate HTML content
        let html = "";
        if (typeof el === "string") {
            html = el;
        } else {
            html = el.outerHTML || el.innerHTML || "";
        }

        // Create iframe with HTML content
        iframe = await createPrintIframe(doc, config, { html });

        // wait till network idle time is reached for the iframe
        const waitForNetworkIdle = async () => {
            if (!iframe || !iframe.contentWindow) throw new Error("Iframe or contentWindow is not available");
            
            const iframeWindow = iframe.contentWindow;
            const iframeDoc = iframeWindow.document;
            let consecutiveIdleChecks = 0;
            const requiredIdleChecks = 3; // Number of consecutive idle checks required
            const idleCheckInterval = 200; // ms between checks
            const startTime = Date.now();

            return new Promise<void>((resolve, reject) => {
                const checkNetworkIdle = () => {
                    const currentTime = Date.now();
                    if (currentTime - startTime > config.timeout) {
                        reject(new Error(`Network idle timeout reached after ${config.timeout}ms`));
                        return;
                    }

                    // Check document ready state
                    const readyState = iframeDoc.readyState;
                    console.log(`Network idle check - ReadyState: ${readyState}, Idle checks: ${consecutiveIdleChecks}`);

                    // Check for active network requests using Performance API if available
                    let hasActiveRequests = false;
                    try {
                        const performance = iframeWindow.performance;
                        if (performance && performance.getEntriesByType) {
                            const resources = performance.getEntriesByType('resource');
                            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
                            
                            // Check if any resources are still loading
                            const recentResources = resources.filter(resource => {
                                const resourceTime = resource.startTime + (navigation?.fetchStart || 0);
                                return currentTime - resourceTime < 1000; // Resources loaded in last second
                            });
                            
                            hasActiveRequests = recentResources.some(resource => {
                                const resourceTiming = resource as PerformanceResourceTiming;
                                return (
                                    resourceTiming.responseEnd === 0 || // Still loading
                                    resourceTiming.responseEnd - resourceTiming.responseStart < 50
                                ); // Very recent completion
                            });
                        }
                    } catch (error) {
                        console.warn('Performance API check failed:', error);
                    }

                    // Check for pending images
                    const images = Array.from(iframeDoc.images);
                    const imagesLoading = images.some(img => !img.complete);

                    // Check for pending scripts and stylesheets
                    const scripts = Array.from(iframeDoc.scripts);
                    const stylesheets = Array.from(iframeDoc.querySelectorAll('link[rel="stylesheet"]'));
                    const scriptsLoading = scripts.some(script => {
                        const scriptElement = script as any;
                        return scriptElement.readyState && scriptElement.readyState === 'loading';
                    });
                    const stylesheetsLoading = stylesheets.some(link => {
                        try {
                            return !(link as HTMLLinkElement).sheet;
                        } catch {
                            return true;
                        }
                    });

                    // Check if document is complete and no resources are actively loading
                    const isIdle = readyState === 'complete' && 
                                  !hasActiveRequests && 
                                  !imagesLoading && 
                                  !scriptsLoading && 
                                  !stylesheetsLoading;

                    if (isIdle) {
                        consecutiveIdleChecks++;
                        console.log(`Network appears idle (${consecutiveIdleChecks}/${requiredIdleChecks})`);
                        
                        if (consecutiveIdleChecks >= requiredIdleChecks) {
                            console.log('Network idle achieved - all resources loaded');
                            resolve();
                            return;
                        }
                    } else {
                        consecutiveIdleChecks = 0;
                        console.log('Network still active:', {
                            readyState,
                            hasActiveRequests,
                            imagesLoading,
                            scriptsLoading,
                            stylesheetsLoading
                        });
                    }

                    // Continue checking
                    setTimeout(checkNetworkIdle, idleCheckInterval);
                };

                // Start checking after initial delay to allow iframe to start loading
                setTimeout(checkNetworkIdle, 100);
            });
        };

        // Wait for network idle and then print
        await waitForNetworkIdle();
        await config.onBeforePrint?.();

        const iframeWindow = iframe?.contentWindow;
        if (!iframeWindow) {
            return handleError(new Error("Failed to access iframe window"));
        }

        // Focus and print
        iframeWindow.focus();
        iframeWindow.print();

        // Handle success
        await handleSuccess();
    } catch (error) {
        return handleError(error instanceof Error ? error : new Error("Unknown error occurred"));
    }
}

/**
 * Legacy synchronous version of printElement for backward compatibility.
 *
 * @deprecated Use the Promise-based printElement function instead
 * @param doc - The document object
 * @param el - The HTML element or string to print
 */
export function printElementSync(doc: Document, el: string | HTMLElement = doc.body, options: PrintElementOptions = {}): void {
    printElement(doc, el, { title: options.title, copyStyles: true }).catch(console.error);
}

/**
 * Prints a URL by loading it in an iframe and then printing it.
 * 
 * @param doc - The document object
 * @param url - The URL to load and print
 * @param options - Configuration options for printing
 * @param headers - Optional headers (not used in iframe approach but kept for compatibility)
 * @returns Promise that resolves when printing is complete
 */
export async function printUrl(doc: Document, url: string, options: PrintElementOptions = {}, headers = {}): Promise<void> {
    console.log("printUrl called with:", { url, options, headers });
    
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
        }
        return Promise.reject<void>(new Error(`Print operation timed out after ${config.timeout}ms`));
    };

    // Success handler
    const handleSuccess = async () => {
        if (!isResolved) {
            isResolved = true;
            try {
                if (config.onAfterPrint) {
                    await config.onAfterPrint();
                }
                await delay(config.cleanupDelay || 0);
                cleanup();
                return Promise.resolve();
            } catch (error) {
                cleanup();
                return Promise.reject<void>(error);
            }
        }
    };

    // Error handler
    const handleError = (error: Error) => {
        if (!isResolved) {
            isResolved = true;
            cleanup();
        }
        return Promise.reject<void>(error);
    };

    if (!url) return handleError(new Error("No URL provided to print"));

    // Set default options
    const config = {
        title: "Print URL",
        copyStyles: false, // For URLs, we don't copy styles from parent document
        cleanupDelay: 1000,
        timeout: 30000,
        waitForImages: true,
        removeAfterPrint: true,
        baseUrl: typeof window !== "undefined" ? window.location.origin : undefined,
        ...options,
    };

    let iframe: HTMLIFrameElement | null = null;
    let timeoutId = null;
    let isResolved = false;

    try {
        // Set timeout
        timeoutId = setTimeout(handleTimeout, config.timeout);

        // Create iframe with URL source
        iframe = await createPrintIframe(doc, config, { src: url });

        // Wait for network idle
        await waitForNetworkIdle(iframe, { timeout: config.timeout });
        await config.onBeforePrint?.();

        const iframeWindow = iframe?.contentWindow;
        if (!iframeWindow) {
            return handleError(new Error("Failed to access iframe window"));
        }

        // Focus and print
        iframeWindow.focus();
        iframeWindow.print();

        // Handle success
        await handleSuccess();
    } catch (error) {
        return handleError(error instanceof Error ? error : new Error("Unknown error occurred"));
    }
}
