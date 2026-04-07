import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EMAIL_QUEUE, EmailJobData } from './queue.service';
import { MailService } from 'src/mail/mail.service';

@Processor(EMAIL_QUEUE, {
  concurrency: 1, // strictly one at a time
})
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    const { email, name, company } = job.data;
    this.logger.log(`Processing job #${job.id} → ${email}`);

    try {
      await this.mailService.sendApplicationEmail(email, name, company);
      this.logger.log(`✓ Email sent to ${email}`);
    } catch (err) {
      this.logger.error(`✗ Failed to send to ${email}: ${err.message}`);
      throw err; // rethrow so BullMQ retries
    }
  }
}
