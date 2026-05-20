import { createWasender, RetryConfig } from 'wasenderapi';

const retryConfig: RetryConfig = { enabled: true, maxRetries: 2 };

const wasender = createWasender(
  process.env.WASENDER_API_KEY,
  undefined,
  undefined,
  undefined,
  retryConfig,
  process.env.WASENDER_WEBHOOK_SECRET,
);

export default wasender;
