import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "baseUrl",
    standalone: true,
})
export class BaseUrlPipe implements PipeTransform {
    transform(path: string): string {
        if (path.startsWith("/") || path.startsWith("http")) return path;
        return `/${path}`;
    }
}
