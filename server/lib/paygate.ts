import crypto from 'crypto';

export interface PayGateCheckoutRequest {
  reference: string;
  amount: number;      // in cents e.g. 61027 for BWP 610.27
  currency: string;
  email: string;
  returnUrl: string;
  notifyUrl: string;
}

export interface PayGateInitiateParams {
  PAYGATE_ID: string;
  REFERENCE: string;
  AMOUNT: string;
  CURRENCY: string;
  RETURN_URL: string;
  TRANSACTION_DATE: string;
  LOCALE: string;
  COUNTRY: string;
  EMAIL: string;
  NOTIFY_URL: string;
  CHECKSUM: string;
}

class PayGateService {
  public readonly INITIATE_URL = 'https://secure.paygate.co.za/payweb3/initiate.trans';
  public readonly PROCESS_URL  = 'https://secure.paygate.co.za/payweb3/process.trans';

  private get merchantId()  { return process.env.PAYGATE_MERCHANT_ID  || ''; }
  private get merchantKey() { return process.env.PAYGATE_MERCHANT_KEY || ''; }

  buildInitiateParams(req: PayGateCheckoutRequest): PayGateInitiateParams {
    if (!this.merchantId || !this.merchantKey) {
      throw new Error('PAYGATE_MERCHANT_ID and PAYGATE_MERCHANT_KEY must be set in .env');
    }

    const transactionDate = new Date()
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);

    // Order is critical — checksum depends on exact field sequence
    const fields: Record<string, string> = {
      PAYGATE_ID:       this.merchantId,
      REFERENCE:        req.reference,
      AMOUNT:           String(req.amount),
      CURRENCY:         req.currency,
      RETURN_URL:       req.returnUrl,
      TRANSACTION_DATE: transactionDate,
      LOCALE:           'en',
      COUNTRY:          'BWA',
      EMAIL:            req.email,
      NOTIFY_URL:       req.notifyUrl,
    };

    const checksum = crypto
      .createHash('md5')
      .update(Object.values(fields).join('') + this.merchantKey)
      .digest('hex');

    return { ...fields, CHECKSUM: checksum } as PayGateInitiateParams;
  }

  // Formula: MD5(PAYGATE_ID + PAY_REQUEST_ID + REFERENCE + KEY)
  buildProcessChecksum(payRequestId: string, reference: string): string {
    return crypto
      .createHash('md5')
      .update(this.merchantId + payRequestId + reference + this.merchantKey)
      .digest('hex');
  }

  // Verify checksum from NOTIFY_URL callback — preserve FormData insertion order, never sort
  verifyCallbackChecksum(data: Record<string, string>): boolean {
    const { CHECKSUM, ...rest } = data;
    if (!CHECKSUM) return false;
    const calculated = crypto
      .createHash('md5')
      .update(Object.values(rest).join('') + this.merchantKey)
      .digest('hex');
    return calculated === CHECKSUM;
  }

  // Verify checksum from RETURN_URL browser redirect
  verifyReturnChecksum(payRequestId: string, reference: string, checksum: string): boolean {
    if (!checksum) return false;
    const calculated = crypto
      .createHash('md5')
      .update(this.merchantId + payRequestId + reference + this.merchantKey)
      .digest('hex');
    return calculated === checksum;
  }
}

export const payGate = new PayGateService();
