// utils/storeBrokerPayload.ts

/**
 * Generic helper to forward or store broker form submissions.
 * You can expand this later to save to your DB, forward to an API,
 * email a notification, write to Google Sheets, etc.
 */
export async function forwardOrStore(type: string, payload: any) {
  // For now, we’ll log it so your route continues to work
  console.log(`[storeBrokerPayload] Received type="${type}"`, payload);

  // TODO: Add real storage/forwarding logic here later
  // Example:
  // await someDatabaseQuery(payload);
  // await fetch("https://your-webhook-url.com", { method: "POST", body: JSON.stringify(payload) });

  return {
    stored: true,
    timestamp: new Date().toISOString(),
  };
}
