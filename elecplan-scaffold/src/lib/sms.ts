type SmsSendResult = {
  providerId: string | null;
};

export function smsConfigured(): boolean {
  return Boolean(process.env.CLICKSEND_USERNAME && process.env.CLICKSEND_API_KEY);
}

export async function sendSms(to: string, body: string): Promise<SmsSendResult> {
  const username = process.env.CLICKSEND_USERNAME;
  const apiKey = process.env.CLICKSEND_API_KEY;
  if (!username || !apiKey) {
    throw new Error("SMS_NOT_CONFIGURED");
  }

  const auth = Buffer.from(`${username}:${apiKey}`).toString("base64");
  const response = await fetch("https://rest.clicksend.com/v3/sms/send", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{
        source: "elecplan-portal",
        body,
        to,
      }],
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null) as {
    response_code?: string;
    response_msg?: string;
    data?: { messages?: Array<{ message_id?: string; status?: string }> };
  } | null;

  const message = payload?.data?.messages?.[0];
  if (!response.ok || payload?.response_code !== "SUCCESS" || (message?.status && message.status !== "SUCCESS")) {
    throw new Error(payload?.response_msg || message?.status || "SMS_SEND_FAILED");
  }

  return { providerId: message?.message_id ?? null };
}
