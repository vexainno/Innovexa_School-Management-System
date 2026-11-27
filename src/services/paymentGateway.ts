/**
 * Single connection point for online fee payments.
 *
 * Live payments need a licensed provider (for example Flutterwave, or the MTN MoMo / Orange Money merchant APIs)
 * plus a small backend that holds the secret keys and confirms each payment by webhook before it is recorded.
 * Until a provider is connected, this adapter runs in demonstration mode: it validates input and simulates the
 * provider's steps, and no money moves.
 *
 * Card numbers and CVV are never stored or logged. In live mode the card form should be the provider's hosted or
 * embedded secure fields; only the brand and last four digits are kept on the receipt.
 */
export type CardBrand = 'Visa' | 'Mastercard' | 'Verve' | 'American Express' | 'Card';

export function cardBrand(num: string): CardBrand {
  const n = num.replace(/\D/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard';
  if (/^(506[01]|507[89]|6500)/.test(n)) return 'Verve';
  if (/^3[47]/.test(n)) return 'American Express';
  return 'Card';
}

export function luhnValid(num: string) {
  const n = num.replace(/\D/g, '');
  if (n.length < 13 || n.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

export function expiryValid(mmYY: string) {
  const m = mmYY.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

export const formatCardNumber = (v: string) => v.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');

export interface ChargeResult { ok: boolean; reference: string; message?: string }

export const paymentGateway = {
  /** True once the school's provider keys are configured on the backend. */
  live: false,

  /** Step 1 for cards: the provider may require 3-D Secure (a one-time code from the bank). */
  async startCardPayment(input: { amount: number; cardNumber: string; expiry: string; cvv: string; name: string }): Promise<{ needsOtp: boolean; sessionId: string; last4: string; brand: CardBrand }> {
    await wait(900);
    const digits = input.cardNumber.replace(/\D/g, '');
    return { needsOtp: true, sessionId: `ses_${Date.now().toString(36)}`, last4: digits.slice(-4), brand: cardBrand(digits) };
  },
  async confirmCardOtp(sessionId: string, otp: string): Promise<ChargeResult> {
    await wait(900);
    if (!/^\d{6}$/.test(otp)) return { ok: false, reference: '', message: 'Enter the 6-digit code sent by your bank.' };
    return { ok: true, reference: `CARD-${sessionId.slice(-6).toUpperCase()}` };
  },

  /** Mobile money: the provider pushes an approval prompt to the payer's phone; they approve with their PIN. */
  async requestMobileMoney(input: { provider: string; phone: string; amount: number }): Promise<{ requestId: string }> {
    await wait(800);
    return { requestId: `${input.provider.startsWith('MTN') ? 'MOMO' : 'OM'}-${Date.now().toString(36).toUpperCase()}` };
  },
  async checkMobileMoney(requestId: string): Promise<ChargeResult> {
    await wait(700);
    return { ok: true, reference: requestId };
  },
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
