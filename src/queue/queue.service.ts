import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export const EMAIL_QUEUE = 'email-queue';

export interface EmailJobData {
  email: string;
  name?: string;
  company?: string;
}

const DELAY_BETWEEN_JOBS_MS = 180000; // 3 minutes

@Injectable()
export class QueueService {
  constructor(@InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue) {}

  async addEmailJobs(recipients: EmailJobData[]): Promise<void> {
    for (let i = 0; i < recipients.length; i++) {
      await this.emailQueue.add('send-email', recipients[i], {
        delay: i * DELAY_BETWEEN_JOBS_MS,
        attempts: 3,
        backoff: { type: 'fixed', delay: 5000 },
        removeOnComplete: false,
        removeOnFail: false,
        jobId: `email-${recipients[i].email}-${Date.now()}-${i}`,
      });
    }
    console.log(`Queued ${recipients.length} email jobs`);
  }

  async getStatus() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed };
  }
}
