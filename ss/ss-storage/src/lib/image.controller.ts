import { Controller, Get, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";



import {ImageService} from "./image.svr";

//TODO:move this to service and add storage caching + add cleaning service or UI + benchmark
@Controller('img')
export class ImageController {

    constructor(private imgService: ImageService) { }

    @Get('**')
    public async get(@Req() req: Request | any, @Res() res: Response) {

        //todo: fix line 88 path
        // const path = decodeURIComponent(req.path).substring("/img".length); //remove base
        // const img = this.imgService.get("/apps/appname/src/assets", path, req.query);
        // if (!img) return res.status(404).send('');
        // res.type(`image/${req.query.format || 'png'}`);
        // img.pipe(res);
    }
}

