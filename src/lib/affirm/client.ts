// ============================================
// Affirm Configuration
// ============================================

/**
 * Smallest booking total offered Affirm. Pay in 4 starts at $50, so the
 * Affirm option is hidden below this. Affirm customers pay the full price.
 */
export const AFFIRM_MIN_CENTS = 5000;

type AffirmEnvironment = 'sandbox' | 'production';

const API_BASE_URL: Record<AffirmEnvironment, string> = {
  sandbox: 'https://sandbox.affirm.com/api/v1',
  production: 'https://api.affirm.com/api/v1',
};

const SCRIPT_URL: Record<AffirmEnvironment, string> = {
  sandbox: 'https://cdn1-sandbox.affirm.com/js/v2/affirm.js',
  production: 'https://cdn1.affirm.com/js/v2/affirm.js',
};

function getEnvironment(): AffirmEnvironment {
  return process.env.NEXT_PUBLIC_AFFIRM_ENV === 'production' ? 'production' : 'sandbox';
}

/**
 * Affirm is offered only when both keys are set AND the environment is named
 * explicitly. Production keys with no environment would silently hit the
 * sandbox and fail on the first customer, so that case hides the button.
 */
export function isAffirmConfigured(): boolean {
  const env = process.env.NEXT_PUBLIC_AFFIRM_ENV;
  return Boolean(
    process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_KEY &&
      process.env.AFFIRM_PRIVATE_KEY &&
      (env === 'sandbox' || env === 'production')
  );
}

function getAuthHeader(): string {
  const publicKey = process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_KEY;
  const privateKey = process.env.AFFIRM_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error('NEXT_PUBLIC_AFFIRM_PUBLIC_KEY and AFFIRM_PRIVATE_KEY must both be set');
  }

  return `Basic ${Buffer.from(`${publicKey}:${privateKey}`).toString('base64')}`;
}

// ============================================
// Transaction Types
// ============================================

export interface AffirmTransaction {
  id: string;
  status: string; // authorized | captured | voided | refunded | partially_refunded | disputed
  amount: number; // cents
  currency: string;
  order_id?: string;
  checkout_id?: string;
  authorization_expiration?: string;
}

export interface AffirmResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  statusCode?: number; // absent when Affirm never answered (network error)
}

/**
 * A failure where we don't know what Affirm did: no response, a 5xx, a
 * conflict, or rate limiting. The call may have gone through, so never treat
 * it as "declined" — retry with the same Idempotency-Key or read the state.
 */
export function isOutcomeUnknown(result: AffirmResult<unknown>): boolean {
  if (result.success) return false;
  const status = result.statusCode;
  return status === undefined || status >= 500 || status === 409 || status === 429;
}

// ============================================
// Transactions API
// ============================================

/**
 * POST to the Transactions API. Every call carries an Idempotency-Key, so a
 * retried request returns the original result instead of acting twice.
 */
async function affirmPost<T>(
  path: string,
  body: Record<string, unknown>,
  idempotencyKey: string
): Promise<AffirmResult<T>> {
  try {
    const response = await fetch(`${API_BASE_URL[getEnvironment()]}${path}`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const text = await response.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // Non-JSON error bodies fall through to the status check below
    }

    if (!response.ok) {
      const err = (json ?? {}) as { message?: string; code?: string };
      console.error(`[Affirm] ${path} failed (${response.status}):`, text.slice(0, 500));
      return {
        success: false,
        error: err.message || `Affirm request failed (${response.status})`,
        errorCode: err.code,
        statusCode: response.status,
      };
    }

    return { success: true, data: json as T };
  } catch (error) {
    console.error(`[Affirm] ${path} error:`, error);
    return {
      success: false,
      error: 'Could not reach Affirm',
    };
  }
}

/**
 * Read a transaction's current state (authorized, captured, voided, ...).
 */
export async function readTransaction(
  transactionId: string
): Promise<AffirmResult<AffirmTransaction>> {
  try {
    const response = await fetch(
      `${API_BASE_URL[getEnvironment()]}/transactions/${encodeURIComponent(transactionId)}`,
      {
        headers: { Authorization: getAuthHeader(), Accept: 'application/json' },
        cache: 'no-store',
      }
    );
    const text = await response.text();
    if (!response.ok) {
      console.error(`[Affirm] read ${transactionId} failed (${response.status}):`, text.slice(0, 500));
      return { success: false, error: `Affirm read failed (${response.status})`, statusCode: response.status };
    }
    return { success: true, data: JSON.parse(text) as AffirmTransaction };
  } catch (error) {
    console.error(`[Affirm] read ${transactionId} error:`, error);
    return { success: false, error: 'Could not reach Affirm' };
  }
}

/**
 * Authorize the loan the customer accepted in the Affirm modal.
 * The checkout token is the `checkout_token` from the modal's onSuccess callback.
 */
export async function authorizeTransaction(
  checkoutToken: string,
  orderId: string
): Promise<AffirmResult<AffirmTransaction>> {
  const result = await affirmPost<AffirmTransaction>(
    '/transactions',
    { transaction_id: checkoutToken, order_id: orderId },
    `authorize-${checkoutToken}`
  );

  if (result.success && result.data) {
    console.log(
      `[Affirm] Authorized: ${result.data.id}, status: ${result.data.status}, amount: ${result.data.amount}`
    );
  }

  return result;
}

/**
 * Capture an authorized loan so Affirm pays out (2-3 business days by ACH).
 */
export async function captureTransaction(
  transactionId: string,
  orderId: string
): Promise<AffirmResult<{ type?: string; amount?: number; fee?: number }>> {
  const result = await affirmPost<{ type?: string; amount?: number; fee?: number }>(
    `/transactions/${encodeURIComponent(transactionId)}/capture`,
    { order_id: orderId },
    `capture-${transactionId}`
  );

  if (result.success) {
    console.log(`[Affirm] Captured: ${transactionId}, amount: ${result.data?.amount}`);
  }

  return result;
}

/**
 * Cancel an authorized loan that hasn't been captured. Captured loans need a
 * refund instead, which the owner does in the Affirm merchant dashboard.
 */
export async function voidTransaction(transactionId: string): Promise<AffirmResult<unknown>> {
  const result = await affirmPost<unknown>(
    `/transactions/${encodeURIComponent(transactionId)}/void`,
    {},
    `void-${transactionId}`
  );

  if (result.success) {
    console.log(`[Affirm] Voided: ${transactionId}`);
  }

  return result;
}

// ============================================
// Client-side Configuration
// ============================================

/**
 * Affirm configuration for the booking page. The public key is meant to be
 * shown in the browser; the private key never leaves the server.
 */
export function getClientConfig() {
  const environment = getEnvironment();

  return {
    enabled: isAffirmConfigured(),
    publicApiKey: process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_KEY || '',
    scriptUrl: SCRIPT_URL[environment],
    environment,
    minCents: AFFIRM_MIN_CENTS,
  };
}
