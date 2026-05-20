import { createWasender, RetryConfig } from 'wasenderapi';

const retryConfig: RetryConfig = { enabled: true, maxRetries: 2 };

let _wasender: ReturnType<typeof createWasender> | null = null;

export function getWasender() {
  if (_wasender) return _wasender;
  const apiKey = process.env.WASENDER_API_KEY;
  if (!apiKey) return null;
  _wasender = createWasender(apiKey, undefined, undefined, undefined, retryConfig, process.env.WASENDER_WEBHOOK_SECRET);
  return _wasender;
}
