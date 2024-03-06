import { Controller, Get } from '@nestjs/common';
import { Message } from '../../messaging/model';
import { GeoipSrvService } from '../geoip-srv/geoip-srv.service';

@Controller('geoip')
export class GeoipController {

    constructor(private geoipService: GeoipSrvService){}
    @Get()
    public async getCountryCode(@Message() msg){
     
        let country 
        try { country = await this.geoipService.getCountryCode(msg.ctx?.ip);}
        catch(error){ return 'TR'}
        return country
    }
}
