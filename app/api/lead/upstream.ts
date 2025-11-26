export async function postToGAS(payload: unknown, tag: "broker" | "newsletter") {
  const url = process.env.WEBHOOK_URL;
  const key = process.env.WEBHOOK_SECRET;

  if (!url || !key) {
    console.error(`[${tag}] no WEBHOOK set`, payload);
    return { ok: false, error: "server_misconfigured" };
  }

  const target = `${url}?key=${encodeURIComponent(key)}`;
  const res = await fetch(target, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await res.json(); // GAS returns 200 with {ok:boolean,...}
  return data as any;
}

export async function notifySlack(payload: any) {
  const hook = process.env.SLACK_LEADS_WEBHOOK_URL;
  if (!hook) return;
  try {
    await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🆕 *${payload.type}* lead\n• *Email:* ${payload.email}\n• *Employees:* ${payload.employees ?? "-"}\n• *From:* ${payload.sourceTitle ?? payload.sourceSlug ?? "-"}`
      }),
    });
  } catch (e) {
    console.error("Slack notify failed", e);
  }
}
