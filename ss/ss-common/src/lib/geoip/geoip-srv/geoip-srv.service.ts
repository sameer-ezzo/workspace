import { Injectable } from '@nestjs/common';
import { Reader } from '@maxmind/geoip2-node';
import { firstValueFrom ,from} from 'rxjs';
import { logger } from '../../logger';

@Injectable()
export class GeoipSrvService {
    async getCountryCode(ip: string){
        const reader = await Reader.open('/home/mohammad/geo-ip-test/geoip2-cli/GeoLite2-Country.mmdb')
        const res =  reader.country(ip)
        return res.country.isoCode

        
        // Reader.open('/home/mohammad/geo-ip-test/geoip2-cli/GeoLite2-Country.mmdb').then(reader => {
        //     const response = reader.country(ip);
        //     logger.info(response.country.isoCode); // 'US'
        //     return response.country.isoCode;
        //   });
    }
}
