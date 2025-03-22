declare module 'react-native-razorpay' {
    export interface RazorpayCheckoutOptions {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      prefill: {
        name: string;
        email: string;
        contact?: string;
      };
      notes?: Record<string, string>;
      retry?: {
        enabled: boolean;
        max_count: number;
      };
      timeout?: number;
      theme?: {
        color: string;
      };
    }
  
    export interface RazorpayResponse {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }
  
    const RazorpayCheckout: {
      open(options: RazorpayCheckoutOptions): Promise<RazorpayResponse>;
    };
  
    export default RazorpayCheckout;
  }
  