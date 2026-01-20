import { Client, Environment, ApiError } from 'square';
import crypto from 'crypto';

// ============================================
// Square Client Configuration
// ============================================

function getSquareClient(): Client {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const squareEnv = process.env.SQUARE_ENV || 'sandbox';

  if (!accessToken) {
    throw new Error('SQUARE_ACCESS_TOKEN environment variable is not set');
  }

  return new Client({
    accessToken,
    environment: squareEnv === 'production' ? Environment.Production : Environment.Sandbox,
  });
}

function getLocationId(): string {
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) {
    throw new Error('SQUARE_LOCATION_ID environment variable is not set');
  }
  return locationId;
}

// ============================================
// Payment Types
// ============================================

export interface ProcessPaymentParams {
  sourceId: string; // Token from Square Web Payments SDK
  amountCents: number;
  currency?: string;
  customerId?: string;
  note?: string;
  referenceId?: string; // e.g., booking ID
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  status?: string;
  receiptUrl?: string;
  cardBrand?: string;
  last4?: string;
  error?: string;
  errorCode?: string;
}

// ============================================
// Payment Processing
// ============================================

/**
 * Process a payment using Square Payments API.
 * The sourceId comes from the Square Web Payments SDK on the client.
 */
export async function processPayment(params: ProcessPaymentParams): Promise<PaymentResult> {
  const client = getSquareClient();
  const locationId = getLocationId();

  try {
    const idempotencyKey = crypto.randomUUID();

    const response = await client.paymentsApi.createPayment({
      sourceId: params.sourceId,
      idempotencyKey,
      amountMoney: {
        amount: BigInt(params.amountCents),
        currency: params.currency || 'USD',
      },
      locationId,
      note: params.note,
      referenceId: params.referenceId,
      autocomplete: true, // Automatically complete the payment
    });

    const payment = response.result.payment;

    if (!payment) {
      return {
        success: false,
        error: 'No payment returned from Square',
      };
    }

    console.log(`[Square] Payment processed: ${payment.id}, status: ${payment.status}`);

    return {
      success: payment.status === 'COMPLETED',
      paymentId: payment.id,
      status: payment.status,
      receiptUrl: payment.receiptUrl,
      cardBrand: payment.cardDetails?.card?.cardBrand,
      last4: payment.cardDetails?.card?.last4,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('[Square] Payment API error:', error.errors);
      const firstError = error.errors?.[0];
      return {
        success: false,
        error: firstError?.detail || 'Payment processing failed',
        errorCode: firstError?.code,
      };
    }

    console.error('[Square] Payment error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during payment processing',
    };
  }
}

/**
 * Get payment details from Square.
 */
export async function getPayment(paymentId: string): Promise<PaymentResult> {
  const client = getSquareClient();

  try {
    const response = await client.paymentsApi.getPayment(paymentId);
    const payment = response.result.payment;

    if (!payment) {
      return {
        success: false,
        error: 'Payment not found',
      };
    }

    return {
      success: true,
      paymentId: payment.id,
      status: payment.status,
      receiptUrl: payment.receiptUrl,
      cardBrand: payment.cardDetails?.card?.cardBrand,
      last4: payment.cardDetails?.card?.last4,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('[Square] Get payment error:', error.errors);
      return {
        success: false,
        error: error.errors?.[0]?.detail || 'Failed to get payment',
      };
    }

    console.error('[Square] Get payment error:', error);
    return {
      success: false,
      error: 'Failed to retrieve payment details',
    };
  }
}

/**
 * Refund a payment (full or partial).
 */
export async function refundPayment(
  paymentId: string,
  amountCents: number,
  reason?: string
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  const client = getSquareClient();

  try {
    const idempotencyKey = crypto.randomUUID();

    const response = await client.refundsApi.refundPayment({
      idempotencyKey,
      paymentId,
      amountMoney: {
        amount: BigInt(amountCents),
        currency: 'USD',
      },
      reason,
    });

    const refund = response.result.refund;

    console.log(`[Square] Refund processed: ${refund?.id}, status: ${refund?.status}`);

    return {
      success: refund?.status === 'COMPLETED' || refund?.status === 'PENDING',
      refundId: refund?.id,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('[Square] Refund error:', error.errors);
      return {
        success: false,
        error: error.errors?.[0]?.detail || 'Refund failed',
      };
    }

    console.error('[Square] Refund error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during refund',
    };
  }
}

// ============================================
// Webhook Verification
// ============================================

/**
 * Verify Square webhook signature.
 * Returns true if the signature is valid.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  url: string
): boolean {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

  if (!signatureKey) {
    console.error('[Square] SQUARE_WEBHOOK_SIGNATURE_KEY not configured');
    return false;
  }

  try {
    // Square uses HMAC-SHA256 for webhook signatures
    // The signature is base64-encoded
    const hmac = crypto.createHmac('sha256', signatureKey);
    hmac.update(url + body);
    const expectedSignature = hmac.digest('base64');

    // Use timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (error) {
    console.error('[Square] Webhook signature verification error:', error);
    return false;
  }
}

// ============================================
// Client-side Configuration
// ============================================

/**
 * Get Square configuration for client-side SDK.
 * These values are safe to expose to the client.
 */
export function getClientConfig() {
  return {
    applicationId: process.env.NEXT_PUBLIC_SQUARE_APP_ID || '',
    locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '',
    environment: process.env.NEXT_PUBLIC_SQUARE_ENV || 'sandbox',
  };
}
