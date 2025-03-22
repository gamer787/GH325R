import RazorpayCheckout from 'react-native-razorpay';

export interface PaymentOptions {
  amount: number;
  currency?: string;
  name: string;
  description: string;
  notes?: Record<string, string>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export function initializePayment(options: PaymentOptions): Promise<RazorpayResponse> {
  return new Promise((resolve, reject) => {
    // Validate required fields
    if (!options.amount || options.amount <= 0) {
      reject(new Error('Invalid payment amount'));
      return;
    }
    if (!options.name || !options.description) {
      reject(new Error('Payment details are incomplete'));
      return;
    }

    // Always provide a prefill object to satisfy the expected type.
    const razorpayOptions = {
      key: 'YOUR_RAZORPAY_KEY_ID', // Replace with your actual key or load from configuration
      amount: Math.round(options.amount * 100), // Convert amount to paise
      currency: options.currency || 'INR',
      name: options.name,
      description: options.description,
      prefill: {
        name: options.prefill?.name || '',
        email: options.prefill?.email || '',
        contact: options.prefill?.contact,
      },
      notes: options.notes,
      retry: {
        enabled: true,
        max_count: 3,
      },
      timeout: 300,
      theme: {
        color: '#00E5FF',
      },
    };

    RazorpayCheckout.open(razorpayOptions)
      .then((data: RazorpayResponse) => {
        if (!data || !data.razorpay_payment_id) {
          reject(new Error('Payment verification failed'));
          return;
        }
        resolve(data);
      })
      .catch((error: any) => {
        const errorMessage =
          error && error.description
            ? error.description
            : 'Payment failed. Please try again.';
        reject(new Error(errorMessage));
      });
  });
}
