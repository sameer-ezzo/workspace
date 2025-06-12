/**
 * Prints a specific HTML element using a hidden iframe approach.
 *
 * This function creates a hidden iframe, copies the target element's content along with
 * all stylesheets and styles to the iframe, and then triggers the browser's print dialog
 * from within the iframe context. This approach avoids opening new tabs/windows while
 * maintaining proper styling for printed content.
 *
 * @param doc - The document object (typically `document` or injected DOCUMENT token)
 * @param el - The HTML element to print. Defaults to document.body if not specified
 * @param title - The title for the print page. Defaults to 'Print Page'
 *
 * @example
 * ```typescript
 * // Print a specific container element
 * const container = document.querySelector('#payslip-container');
 * printElement(document, container, 'Employee Payslip');
 *
 * // Print entire body with default title
 * printElement(document);
 *
 * // In Angular component with injected DOCUMENT
 * printElement(this.doc, containerElement, 'Custom Title');
 * ```
 *
 * @remarks
 * - The iframe is positioned off-screen and removed after 1 second
 * - All CSS stylesheets and inline styles are copied to maintain formatting
 * - The function handles both element-specific printing and full body printing
 * - Print dialog appears without opening new tabs or windows
 *
 * @since 0.0.3
 */
export function printElement(doc: Document, el = doc.body, title = "Print Page") {
    if (!el) return;

    const styleLinks = doc.querySelectorAll('link[rel="stylesheet"]');
    const styles = doc.querySelectorAll("style");

    // Create hidden iframe
    const iframe = doc.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.left = "-9999px";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";

    doc.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const makeHTML = doc.body === el;
    const html = !makeHTML ? el.outerHTML : `<html></head><body>${el.innerHTML}</body></html>`;
    iframeDoc.write(html);
    iframeDoc.title = title;
    iframeDoc.head.appendChild(Object.assign(doc.createElement("title"), { textContent: title }));
    // append the styles to the iframe document
    styleLinks.forEach((link) => {
        const newLink = doc.createElement("link");
        newLink.rel = "stylesheet";
        newLink.href = link.getAttribute("href") || "";
        newLink.type = link.getAttribute("type") || "text/css";
        iframeDoc.head.appendChild(newLink);
    });
    styles.forEach((style) => {
        const newStyle = doc.createElement("style");
        newStyle.textContent = style.textContent || "";
        iframeDoc.head.appendChild(newStyle);
    });
    iframeDoc.close();

    // Wait for content to load then print
    iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();

        // Clean up iframe after printing
        setTimeout(() => {
            doc.body.removeChild(iframe);
        }, 1000);
    };
}
