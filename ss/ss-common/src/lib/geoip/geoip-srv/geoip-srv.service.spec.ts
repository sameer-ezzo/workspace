import { Test, TestingModule } from '@nestjs/testing';
import { GeoipSrvService } from './geoip-srv.service';

describe('GeoipSrvService', () => {
  let service: GeoipSrvService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeoipSrvService],
    }).compile();

    service = module.get<GeoipSrvService>(GeoipSrvService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
