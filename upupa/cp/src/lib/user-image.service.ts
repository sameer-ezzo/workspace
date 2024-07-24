



export function getInitials(text: string): string {
    if (!text) return '';
    return text
        .split(' ')
        .map(word => word.trim())
        .filter(word => word.length > 0)
        .map(word => word[0].toLocaleUpperCase())
        .join('');
}

export function textToImage(
    text: string,
    color: string = '#fff',
    bgColor: string = '#2e7d32dd'
): string {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const size = 80;

    canvas.width = canvas.height = size;

    // Draw background
    context.fillStyle = bgColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Set text properties
    const fontSize = (0.7 * size) / text.length;
    context.font = `ultra-condensed small-caps ${fontSize}px "Sans", sans-serif`;
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Draw text
    context.fillText(text, 0.5 * size, 0.5 * size, canvas.width);

    return canvas.toDataURL();
}


export function getUserInitialsImage(
    name: string,
    color: string = '#fff',
    bgColor: string = '#2e7d32dd'
): string {
    const initials = getInitials(name);
    return textToImage(initials, color, bgColor);
}
