import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [QueueModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
