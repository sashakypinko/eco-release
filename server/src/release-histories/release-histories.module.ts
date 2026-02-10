import { Module } from '@nestjs/common';
import { ReleaseHistoriesController } from './release-histories.controller';
import { ReleaseHistoriesService } from './release-histories.service';

@Module({
  controllers: [ReleaseHistoriesController],
  providers: [ReleaseHistoriesService],
  exports: [ReleaseHistoriesService],
})
export class ReleaseHistoriesModule {}
