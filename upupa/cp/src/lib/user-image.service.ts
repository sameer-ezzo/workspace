import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { USER_PICTURE_RESOLVER } from "./di.token";


@Injectable({
    providedIn: 'root'
})
export class UserImageService {
    public readonly resolver = inject(USER_PICTURE_RESOLVER) as Observable<string>
}



export function getInitials(text: string) {
    return text?.split(' ').map(x => x.trim()).filter(x => x.length > 0).map(x => x[0].toLocaleUpperCase()).join('');
}
export function textToImage(text: string, color: string = '#fff', bgColor: string = '#2e7d32dd') {

    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    canvas.width = canvas.height = 65;

    context.fillStyle = bgColor;
    context.beginPath();
    context.rect(0, 0, canvas.width, canvas.height);
    context.fill();

    // context.font = (canvas.height / 2) + "px";
    context.fillStyle = color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `ultra-condensed small-caps ${canvas.height / 2}px "Sans", sans-serif`
    // set letter spacing to 0.1 of font size

    
    context.fillText(text, canvas.width / 2, canvas.height / 2, 0.9 * canvas.width);
    return canvas.toDataURL();
}

export function getUserInitialsImage(name: string, color: string = '#fff', bgColor: string = '#2e7d32dd') {
    return textToImage(getInitials(name), color, bgColor)
}