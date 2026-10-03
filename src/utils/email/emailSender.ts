import { EmailPayload } from './emailBuilder';

export type EmailProviderType = 'resend' | 'webhook';

export interface EmailSenderConfig {
  provider: EmailProviderType;
  apiKey?: string;
  webhookUrl?: string;
  fromAddress?: string;
}

export interface SendResult {
  index: number;
  recipient: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends a single email payload via Resend API or Custom Webhook.
 */
export async function sendSingleEmail(
  payload: EmailPayload,
  config: EmailSenderConfig
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (config.provider === 'resend') {
    if (!config.apiKey?.trim()) {
      return { success: false, error: 'Missing Resend API Key.' };
    }

    try {
      const from = config.fromAddress?.trim() || 'onboarding@resend.dev';
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [payload.to.trim()],
          subject: payload.subject,
          text: payload.body,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          success: false,
          error: data?.message || `HTTP ${response.status}: Failed to dispatch via Resend`,
        };
      }

      return { success: true, messageId: data?.id };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network request failed',
      };
    }
  }

  if (config.provider === 'webhook') {
    if (!config.webhookUrl?.trim()) {
      return { success: false, error: 'Missing Custom Webhook URL.' };
    }

    try {
      const response = await fetch(config.webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: payload.to.trim(),
          from: config.fromAddress || payload.from,
          subject: payload.subject,
          body: payload.body,
          dispatchedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Webhook returned status ${response.status}`,
        };
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Webhook dispatch failed',
      };
    }
  }

  return { success: false, error: 'Unsupported email provider.' };
}

/**
 * Sequential batch sender with rate-limiting and progress tracking.
 */
export async function sendEmailBatch(
  queue: EmailPayload[],
  config: EmailSenderConfig,
  options: {
    delayMs?: number;
    signal?: AbortSignal;
    onProgress?: (progress: {
      completed: number;
      total: number;
      currentResult: SendResult;
    }) => void;
  } = {}
): Promise<SendResult[]> {
  const delayMs = options.delayMs ?? 300;
  const results: SendResult[] = [];

  for (let i = 0; i < queue.length; i++) {
    if (options.signal?.aborted) {
      break;
    }

    const item = queue[i];
    const outcome = await sendSingleEmail(item, config);

    const result: SendResult = {
      index: i + 1,
      recipient: item.to,
      success: outcome.success,
      messageId: outcome.messageId,
      error: outcome.error,
    };

    results.push(result);

    if (options.onProgress) {
      options.onProgress({
        completed: results.length,
        total: queue.length,
        currentResult: result,
      });
    }

    // Delay between calls to prevent rate limits, unless it's the last item
    if (i < queue.length - 1 && !options.signal?.aborted) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
