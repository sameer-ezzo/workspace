
export type CollectStyle = 'linear' | '1by1' | 'pages' | 'wizard' | 'tab' | 'accordion';


declare type Font = {
    font: {
        family: string
        file: string
    }
    size: string;
}

declare type VerticalAlignment = 'top' | 'bottom' | 'center' | 'auto' | 'stretched';
declare type HorizontalAlignment = 'lef' | 'right' | 'center' | 'auto' | 'stretched';

export declare type FormDesign = {

    verticalAlignment?: VerticalAlignment;
    horizontalAlignment?: HorizontalAlignment;

    hideNumbering?: boolean;
    hideProgress?: boolean;
    headerFont?: Font;
    paragraphFont?: Font;

    textColor?: string;
    valueColor?: string;
    buttonsColor?: string;
    bgColor?: string;
    bgImage?: {
        url: string;
        files?: any[];
        position: string;
        repeat: string;
        size: string;
    };
};
