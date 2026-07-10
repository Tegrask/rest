export interface ChargeRequest {
  orderId: string;
  amount: number; // cents
  description: string;
  token: string;
}

export interface ChargeResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export async function chargeNxcode({ amount, description, token }: ChargeRequest): Promise<ChargeResult> {
  const appId = process.env.NXCODE_APP_ID || process.env.NEXT_PUBLIC_NXCODE_APP_ID;
  const endpoint = process.env.NXCODE_API_ENDPOINT || "https://studio-api.nxcode.io";

  if (!appId) {
    return { success: true, transactionId: `DEMO-${Date.now()}` };
  }

  try {
    const response = await fetch(`${endpoint}/api/sdk/payment/charge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-App-Id": appId,
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: amount / 100,
        description,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.detail || `Payment failed (${response.status})` };
    }

    const result = await response.json();
    if (!result.success) {
      return { success: false, error: result.error || "Payment failed" };
    }

    return { success: true, transactionId: result.transactionId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Payment error" };
  }
}
