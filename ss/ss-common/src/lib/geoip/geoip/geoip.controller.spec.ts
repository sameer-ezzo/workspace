import { Test, TestingModule } from '@nestjs/testing';
import { GeoipController } from './geoip.controller';

describe('GeoipController', () => {
  let controller: GeoipController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeoipController],
    }).compile();

    controller = module.get<GeoipController>(GeoipController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
