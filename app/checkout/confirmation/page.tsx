'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  shippingInfo: {
    fullName: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if no order ID is provided
    if (!orderId) {
      router.push('/');
      return;
    }

    // Fetch order details
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/orders/${orderId}`);
        
        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to login if unauthorized
            router.push('/login?callbackUrl=/checkout/confirmation');
            return;
          }
          
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch order details');
        }
        
        const orderData = await response.json();
        setOrder(orderData);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load your order. Please check your order history in your profile.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrder();
  }, [orderId, router]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Please try checking your order history in your profile.</p>
              </div>
              <div className="mt-4">
                <Link
                  href="/profile"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go to Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render order confirmation
  return (
    <div className="bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-xl">
          <div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="mt-3">
              <h1 className="text-3xl font-extrabold text-gray-900">Thank you for your order!</h1>
              <p className="mt-2 text-lg text-gray-500">
                Your order has been confirmed and will be shipped soon.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Order number: {order?.id}
              </p>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-200">
            <h2 className="sr-only">Your order</h2>

            <h3 className="sr-only">Items</h3>
            {order?.items.map((item) => (
              <div key={item.id} className="py-6 flex space-x-6">
                <div className="flex-1 flex flex-col">
                  <div>
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <h4>{item.name}</h4>
                      <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="border-t border-gray-200 py-6 space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <p>Order Total</p>
                <p>${order?.total ? Number(order.total).toFixed(2) : '0.00'}</p>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-base font-medium text-gray-900">Shipping Information</h3>
                {order?.shippingInfo && (
                  <div className="mt-2 text-sm text-gray-500">
                    <p>{order.shippingInfo.fullName}</p>
                    <p>{order.shippingInfo.address}</p>
                    <p>{order.shippingInfo.city}, {order.shippingInfo.state} {order.shippingInfo.zipCode}</p>
                    <p>{order.shippingInfo.country}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-8 flex justify-between">
              <Link
                href="/categories"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Continue Shopping
              </Link>
              <Link
                href="/profile"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Order History
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}