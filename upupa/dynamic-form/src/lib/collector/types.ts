declare type VerticalAlignment = "top" | "bottom" | "center" | "auto" | "stretched";
declare type HorizontalAlignment = "left" | "right" | "center" | "auto" | "stretched";
export type CollectStyle = "linear" | "1by1" | "pages" | "wizard" | "tab" | "accordion";

export class Font {
    font: {
        family: string;
        file: string;
    };
    size: string;
}

export class FormDesign {
    constructor(self?: Partial<FormDesign>) {
        if (self) {
            Object.assign(this, self);
        }
    }

    verticalAlignment: VerticalAlignment = "auto";
    horizontalAlignment: HorizontalAlignment = "auto";

    hideNumbering = true;
    hideProgress = false;
    headerFont?: Font;
    paragraphFont?: Font;

    textColor?: string;
    valueColor?: string;
    buttonsColor = "primary";
    bgColor = "transparent";
    bgImage?: {
        url: string;
        files?: any[];
        position: string;
        repeat: string;
        size: string;
    };
}
