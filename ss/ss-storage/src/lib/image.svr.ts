import { Injectable } from "@nestjs/common";
import * as Path from "path";
import { existsSync } from "fs";
import sharp from 'sharp';
import { ResizeOptions } from 'sharp';


// const transform = sharp();
// function resize(path: string, format: string, width: number, height: number) {
//     const readStream = fs.createReadStream(path);
//     let transform = sharp();

//     if (format) transform = transform.toFormat(format);
//     if (width || height) transform = transform.resize(width, height);

//     return readStream.pipe(transform);
// }

@Injectable()
export class ImageService {


    public async get(base: string, path: string, options: any) {
        const imagePath = Path.join(base, path)
        if (!existsSync(imagePath)) { return null; }

        // const operations = Object.keys(options).sort().map(k => `${k}_${options[k]}`);

        // const segments = path.split('.');
        // const pathWithoutExt = segments.slice(0, -1).join('.');
        // const extension = segments[segments.length - 1];
        // const name = `${pathWithoutExt}_${operations.join("_")}.${extension}`;

        let img = sharp(imagePath);
        const w = options.width || options.w
        const h = options.height || options.h
        if (w || h) {

            const resize: ResizeOptions = {};
            if (!isNaN(w)) resize.width = parseInt(w)

            if (!isNaN(h)) resize.height = parseInt(h)

            if (options.fit) resize.fit = options.fit;
            if (options.position) resize.position = options.position;
            if (options.bg) resize.background = options.bg;

            img = img.resize(resize.width, resize.height, resize);
        }

        if (options.format) {
            //res.type(`image/${query.format || 'png'}`);
            img = img.toFormat(options.format);
        }

        if (options.rot) {
            img = img.rotate(parseInt(options.rot));
        }

        if (options.watermark) {
            const text = <string>options.watermark;
            const svg = `<svg height="40" width="${text.length * 10 + 20}"> <text x="0" y="20" font-size="20" opacity="0.6" fill="${options.watercolor || '#000'}">${text}</text> </svg>`;
            img = img.composite([{ input: Buffer.from(svg), tile: true }]);
        }

        //compress size
        const outputOptions: any = {
            quality: isNaN(+options.quality) ? 80 : +options.quality,
            progressive: true,
            force: false
        }
        img.jpeg(outputOptions).png(outputOptions);

        return img;
        //await img.toFile(`img${name}`); //directory must be already there        
    }
}