import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { USER_PICTURE_RESOLVER } from "./di.token";


@Injectable({
    providedIn: 'root'
})
export class UserImageService {
    public readonly resolver = inject(USER_PICTURE_RESOLVER) as Observable<string>
}



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
    const size = 128;

    canvas.width = canvas.height = size;

    // Draw background
    context.fillStyle = bgColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Set text properties
    const fontSize = canvas.height / text.length;
    context.font = `ultra-condensed small-caps ${fontSize}px "Sans", sans-serif`;
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Draw text
    context.fillText(text, canvas.width / 2, canvas.height / 2, 0.75 * canvas.width);

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
