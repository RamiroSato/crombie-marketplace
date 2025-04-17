'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  customizations: Array<{
    areaId: string;
    type: string;
    value: string;
  }>;
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    images: string[];
    category: {
      id: string;
      name: string;
      slug: string;
    };
  };
  price: number;
  total: number;
}

interface Cart {
  id: string;
  items: CartItem[];
  total: number;
  itemCount: number;
}

interface ShippingInfo {
  fullName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

interface PaymentInfo {
  cardNumber: string;
  cardHolder: string;
  expirationDate: string;
  cvv: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
  });
  
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    cardNumber: '',
    cardHolder: '',
    expirationDate: '',
    cvv: '',
  });

  // Constants for calculations
  const TAX_RATE = 0.07; // 7% tax rate
  const SHIPPING_COST = 5.99;
  
  // Fetch cart data
  useEffect(() => {
    const fetchCart = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/cart');
        
        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to login if unauthorized
            router.push('/login?callbackUrl=/checkout');
            return;
          }
          
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch cart');
        }
        
        const cartData = await response.json();
        
        // Redirect to cart page if cart is empty
        if (!cartData || cartData.items.length === 0) {
          router.push('/cart');
          return;
        }
        
        setCart(cartData);
      } catch (err) {
        console.error('Error fetching cart:', err);
        setError('Failed to load your cart. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCart();
  }, [router]);

  // Calculate order totals
  const calculateTotals = () => {
    if (!cart) return { subtotal: 0, tax: 0, shipping: 0, total: 0 };
    
    const subtotal = cart.total;
    const tax = subtotal * TAX_RATE;
    const shipping = SHIPPING_COST;
    const total = subtotal + tax + shipping;
    
    return {
      subtotal,
      tax,
      shipping,
      total
    };
  };
  
  // Handle shipping info changes
  const handleShippingInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle payment info changes
  const handlePaymentInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const formattedValue = value
        .replace(/\s/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim()
        .substring(0, 19); // Limit to 16 digits + 3 spaces
      
      setPaymentInfo(prev => ({
        ...prev,
        [name]: formattedValue
      }));
      return;
    }
    
    // Format expiration date (MM/YY)
    if (name === 'expirationDate') {
      let formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 2) {
        formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2, 4);
      }
      
      setPaymentInfo(prev => ({
        ...prev,
        [name]: formattedValue
      }));
      return;
    }
    
    setPaymentInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Validate form
  const validateForm = () => {
    // Shipping info validation
    if (!shippingInfo.fullName) return 'Full name is required';
    if (!shippingInfo.email || !/^\S+@\S+\.\S+$/.test(shippingInfo.email)) return 'Valid email is required';
    if (!shippingInfo.address) return 'Address is required';
    if (!shippingInfo.city) return 'City is required';
    if (!shippingInfo.state) return 'State is required';
    if (!shippingInfo.zipCode) return 'ZIP code is required';
    if (!shippingInfo.country) return 'Country is required';
    if (!shippingInfo.phone) return 'Phone number is required';
    
    // Payment info validation
    if (!paymentInfo.cardNumber || paymentInfo.cardNumber.replace(/\s/g, '').length !== 16) 
      return 'Valid card number is required';
    if (!paymentInfo.cardHolder) return 'Card holder name is required';
    if (!paymentInfo.expirationDate || !/^\d{2}\/\d{2}$/.test(paymentInfo.expirationDate)) 
      return 'Valid expiration date (MM/YY) is required';
    if (!paymentInfo.cvv || !/^\d{3,4}$/.test(paymentInfo.cvv)) 
      return 'Valid CVV is required';
    
    return null;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      window.scrollTo(0, 0);
      return;
    }
    
    if (!cart) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      
      const { subtotal, tax, shipping, total } = calculateTotals();
      
      // Create order through API
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartId: cart.id,
          shippingInfo,
          subtotal,
          tax,
          shipping,
          total
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process checkout');
      }
      
      const order = await response.json();
      
      // Redirect to order confirmation page
      router.push(`/checkout/confirmation?orderId=${order.id}`);
      
    } catch (err) {
      console.error('Error processing checkout:', err);
      setError('Failed to process your order. Please try again.');
      window.scrollTo(0, 0);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Calculate totals
  const { subtotal, tax, shipping, total } = calculateTotals();

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-8">Checkout</h1>
        
        {/* Error message */}
        {error && (
          <div className="mb-8 bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-5">
          {/* Checkout form */}
          <div className="lg:col-span-3">
            <form id="checkoutForm" onSubmit={handleSubmit}>
              {/* Shipping information */}
              <div className="bg-white shadow overflow-hidden rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6">
                  <h2 className="text-lg font-medium text-gray-900">Shipping Information</h2>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="fullName"
                          id="fullName"
                          value={shippingInfo.fullName}
                          onChange={handleShippingInfoChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <div className="mt-1">
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={shippingInfo.email}
                          onChange={handleShippingInfoChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Street Address
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="address"
                          id="address"
                          value={shippingInfo.address}
                          onChange={handleShippingInfoChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        City
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="city"
                          id="city"
                          value={shippingInfo.city}
                          onChange={handleShippingInfoChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                        State / Province
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="state"
                          id="state"
                          value={shippingInfo.state}
                          onChange={handleShippingInfoChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                        ZIP / Postal Code
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="zipCode"
                          id="zipCode"
                          value={shippingInfo.zipCode}
                          onChange={handleShippingInfoChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                        Country
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="country"
                          id="country"
                          value={shippingInfo.country}
                          onChange={handleShippingInfoChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <div className="mt-1">
                        <input
                          type="tel"
                          name="phone"
                          id="phone"
                          value={shippingInfo.phone}
                          onChange={handleShippingInfoChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment information */}
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h2 className="text-lg font-medium text-gray-900">Payment Information</h2>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
                        Card Number
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="cardNumber"
                          id="cardNumber"
                          value={paymentInfo.cardNumber}
                          onChange={handlePaymentInfoChange}
                          placeholder="XXXX XXXX XXXX XXXX"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="cardHolder" className="block text-sm font-medium text-gray-700">
                        Card Holder Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="cardHolder"
                          id="cardHolder"
                          value={paymentInfo.cardHolder}
                          onChange={handlePaymentInfoChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">
                        Expiration Date
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="expirationDate"
                          id="expirationDate"
                          value={paymentInfo.expirationDate}
                          onChange={handlePaymentInfoChange}
                          placeholder="MM/YY"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">
                        CVV
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="cvv"
                          id="cvv"
                          value={paymentInfo.cvv}
                          onChange={handlePaymentInfoChange}
                          maxLength={4}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 lg:hidden">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    isProcessing ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                {cart && cart.items.map((item) => (
                  <div key={item.id} className="flex py-4 border-b border-gray-200">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      {item.product.images && item.product.images.length > 0 ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-contain object-center"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-100">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1 flex flex-col">
                      <div className="flex justify-between text-sm font-medium text-gray-900">
                        <h3>{item.product.name}</h3>
                        <p className="ml-4">${item.total.toFixed(2)}</p>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <span>Qty: {item.quantity}</span>
                        {item.customizations && item.customizations.length > 0 && (
                          <span className="ml-2 text-xs">(Customized)</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <p>Subtotal</p>
                    <p>${subtotal.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <p>Shipping</p>
                    <p>${shipping.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <p>Tax</p>
                    <p>${tax.toFixed(2)}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-200 flex justify-between text-base font-medium text-gray-900">
                    <p>Total</p>
                    <p>${total.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="hidden lg:block mt-6">
                  <button
                    type="submit"
                    form="checkoutForm"
                    disabled={isProcessing}
                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      isProcessing ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {isProcessing ? 'Processing...' : `Complete Purchase`}
                  </button>
                </div>
                
                <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                  <p>
                    <Link href="/cart" className="text-indigo-600 font-medium hover:text-indigo-500">
                      Return to Cart
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}