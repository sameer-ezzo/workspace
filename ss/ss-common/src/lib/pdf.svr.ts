import { Injectable } from "@nestjs/common";
import { HttpService } from '@nestjs/axios'

import { firstValueFrom } from "rxjs";


@Injectable()
export class PdfService {
    constructor(private readonly http: HttpService) { }
    getPdf(url: string, options: any = { format: "A4" }): Promise<any> {
        const rx = this.http.post(`http://104.248.43.224:3000/pdf/${url}`,
            JSON.stringify(options),
            {
                // encoding: "binary",
                headers: { 'Content-Type': 'application/json' }
            })
        return firstValueFrom(rx)
    }
}
