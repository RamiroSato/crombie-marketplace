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

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch cart data
  useEffect(() => {
    const fetchCart = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/cart');
        
        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to login if unauthorized
            router.push('/login?callbackUrl=/cart');
            return;
          }
          
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch cart');
        }
        
        const cartData = await response.json();
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

  // Update item quantity
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (!cart) return;
    
    try {
      setIsProcessing(true);
      
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update item');
      }
      
      // Update local cart state
      if (newQuantity === 0) {
        // Remove item if quantity is 0
        setCart({
          ...cart,
          items: cart.items.filter(item => item.id !== itemId),
          itemCount: cart.itemCount - 1,
          total: cart.total - cart.items.find(item => item.id === itemId)!.total
        });
      } else {
        // Update quantity
        const updatedItems = cart.items.map(item => {
          if (item.id === itemId) {
            const newTotal = item.price * newQuantity;
            return {
              ...item,
              quantity: newQuantity,
              total: newTotal
            };
          }
          return item;
        });
        
        const newTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
        
        setCart({
          ...cart,
          items: updatedItems,
          total: newTotal
        });
      }
    } catch (err) {
      console.error('Error updating item:', err);
      setError('Failed to update item. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove item from cart
  const removeItem = async (itemId: string) => {
    if (!cart) return;
    
    try {
      setIsProcessing(true);
      
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove item');
      }
      
      // Update local cart state
      const removedItem = cart.items.find(item => item.id === itemId);
      if (removedItem) {
        setCart({
          ...cart,
          items: cart.items.filter(item => item.id !== itemId),
          itemCount: cart.itemCount - 1,
          total: cart.total - removedItem.total
        });
      }
    } catch (err) {
      console.error('Error removing item:', err);
      setError('Failed to remove item. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Proceed to checkout
  const proceedToCheckout = () => {
    router.push('/checkout');
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your cart...</p>
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
                <p>Please try refreshing the page or contact customer support if the problem persists.</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() => window.location.reload()}
                >
                  Refresh page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render empty cart
  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
            />
          </svg>
          <h2 className="mt-2 text-lg font-medium text-gray-900">Your cart is empty</h2>
          <p className="mt-1 text-sm text-gray-500">
            Start shopping to add items to your cart
          </p>
          <div className="mt-6">
            <Link
              href="/categories"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render cart with items
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-8">Shopping Cart</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <ul role="list" className="divide-y divide-gray-200">
          {cart.items.map((item) => (
            <li key={item.id} className="flex py-6 px-6">
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                {item.product.images && item.product.images.length > 0 ? (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    width={96}
                    height={96}
                    className="h-full w-full object-contain object-center"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400 text-xs">No image</span>
                  </div>
                )}
              </div>

              <div className="ml-4 flex flex-1 flex-col">
                <div>
                  <div className="flex justify-between text-base font-medium text-gray-900">
                    <h3>
                      <Link href={`/categories/${item.product.category.slug}/${item.product.slug}`}>
                        {item.product.name}
                      </Link>
                    </h3>
                    <p className="ml-4">${item.total.toFixed(2)}</p>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Category: {item.product.category.name}
                  </p>
                </div>
                
                {/* Customizations */}
                {item.customizations && item.customizations.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-xs font-medium text-gray-500">Customizations:</h4>
                    <ul className="mt-1 space-y-1">
                      {item.customizations.map((customization, index) => (
                        <li key={index} className="text-xs text-gray-500 flex">
                          <span className="font-medium mr-1">
                            {customization.type === 'TEXT' ? 'Text:' : 
                             customization.type === 'COLOR' ? 'Color:' : 
                             'Image:'}
                          </span>
                          {customization.type === 'COLOR' ? (
                            <span className="flex items-center">
                              <span
                                className="inline-block h-3 w-3 rounded-full mr-1"
                                style={{ backgroundColor: customization.value }}
                              ></span>
                              {customization.value}
                            </span>
                          ) : customization.type === 'IMAGE' ? (
                            <span className="text-indigo-600">Custom image uploaded</span>
                          ) : (
                            customization.value
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex flex-1 items-end justify-between text-sm mt-2">
                  <div className="flex items-center">
                    <label htmlFor={`quantity-${item.id}`} className="mr-2 text-gray-500">
                      Qty
                    </label>
                    <select
                      id={`quantity-${item.id}`}
                      name={`quantity-${item.id}`}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                      disabled={isProcessing}
                      className="rounded-md border-gray-300 py-1.5 text-base leading-5 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>
                          {num === 0 ? 'Remove' : num}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={isProcessing}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        
        <div className="border-t border-gray-200 px-6 py-6">
          <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
            <p>Subtotal</p>
            <p>${cart.total.toFixed(2)}</p>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">
            Shipping and taxes calculated at checkout.
          </p>
          <div className="mt-6">
            <button
              onClick={proceedToCheckout}
              disabled={isProcessing}
              className={`flex items-center justify-center w-full rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                isProcessing ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              Checkout
            </button>
          </div>
          <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
            <p>
              or{' '}
              <Link
                href="/categories"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Continue Shopping
                <span aria-hidden="true"> &rarr;</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}