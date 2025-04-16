// components/products/product-customizer.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Define types
interface CustomizableArea {
  id: string;
  name: string;
  type: 'TEXT' | 'IMAGE' | 'COLOR';
  extraCharge: number | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  images: string[];
  customizableAreas: CustomizableArea[];
}

interface Customization {
  areaId: string;
  type: 'TEXT' | 'IMAGE' | 'COLOR';
  value: string;
}

interface ProductCustomizerProps {
  product: Product;
}

// Constants for color choices
const COLOR_OPTIONS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Green', value: '#00FF00' },
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'Purple', value: '#800080' },
  { name: 'Grey', value: '#808080' },
];

export default function ProductCustomizer({ product }: ProductCustomizerProps) {
  const router = useRouter();
  const [customizations, setCustomizations] = useState<Customization[]>([]);
  const [activeImage, setActiveImage] = useState<string>(product.images[0] || '');
  const [totalPrice, setTotalPrice] = useState<number>(product.basePrice);
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        setIsAuthenticated(response.ok);
      } catch (error) {
        console.error('Error checking authentication:', error);
      }
    };
    
    checkAuth();
  }, []);
  
  // Initialize customizations based on product areas
  useEffect(() => {
    const initialCustomizations = product.customizableAreas.map(area => ({
      areaId: area.id,
      type: area.type,
      value: area.type === 'COLOR' ? COLOR_OPTIONS[0].value : '',
    }));
    
    setCustomizations(initialCustomizations);
  }, [product.customizableAreas]);
  
  // Calculate total price based on customizations
  useEffect(() => {
    let total = product.basePrice;
    
    customizations.forEach(customization => {
      const area = product.customizableAreas.find(a => a.id === customization.areaId);
      if (area?.extraCharge && customization.value) {
        total += area.extraCharge;
      }
    });
    
    setTotalPrice(total);
  }, [customizations, product.basePrice, product.customizableAreas]);
  
  // Handle customization changes
  const handleCustomizationChange = (areaId: string, value: string) => {
    setCustomizations(prev => 
      prev.map(item => 
        item.areaId === areaId ? { ...item, value } : item
      )
    );
  };
  
  // Handle image upload
  const handleImageUpload = async (areaId: string, file: File) => {
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed.');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'customizations');
      
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        handleCustomizationChange(areaId, data.url);
      } else {
        alert('Failed to upload image. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('An error occurred while uploading the image.');
    }
  };
  
  // Add to cart
  const addToCart = async () => {
    if (!isAuthenticated) {
      // Redirect to login with callback URL
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    
    setIsAddingToCart(true);
    
    try {
      const filteredCustomizations = customizations.filter(c => c.value);
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
          customizations: filteredCustomizations,
        }),
      });
      
      if (response.ok) {
        // Navigate to cart page
        router.push('/cart');
      } else {
        const data = await response.json();
        alert(`Failed to add to cart: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('An error occurred while adding the product to your cart.');
    } finally {
      setIsAddingToCart(false);
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Product images */}
      <div>
        <div className="relative h-80 overflow-hidden rounded-lg mb-4">
          {activeImage ? (
            <Image width={1000} height={1000}
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
        </div>
        
        {/* Thumbnails */}
        {product.images.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setActiveImage(image)}
                className={`relative w-16 h-16 rounded-md border-2 ${
                  activeImage === image ? 'border-indigo-500' : 'border-gray-200'
                }`}
              >
                <Image
                  src={image}
                  alt={`${product.name} - Image ${index + 1}`}
                  className="object-cover"
                  fill
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Product details and customization */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>
        <p className="text-gray-500 mt-2">{product.description}</p>
        
        <div className="mt-6">
          <h2 className="text-lg font-medium text-gray-800">Customize Your Product</h2>
          
          <div className="mt-4 space-y-6">
            {product.customizableAreas.map((area) => (
              <div key={area.id} className="border-b pb-4">
                <div className="flex justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    {area.name}
                  </label>
                  {area.extraCharge ? (
                    <span className="text-sm text-gray-500">
                      +${area.extraCharge.toFixed(2)}
                    </span>
                  ) : null}
                </div>
                
                {area.type === 'TEXT' && (
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-black py-1 px-2 bg-white sm:text-sm"
                    placeholder={`Enter text for ${area.name}`}
                    value={customizations.find(c => c.areaId === area.id)?.value || ''}
                    onChange={(e) => handleCustomizationChange(area.id, e.target.value)}
                  />
                )}
                
                {area.type === 'COLOR' && (
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`h-8 w-full rounded-md border ${
                          customizations.find(c => c.areaId === area.id)?.value === color.value
                            ? 'ring-2 ring-indigo-500'
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                        onClick={() => handleCustomizationChange(area.id, color.value)}
                      />
                    ))}
                  </div>
                )}
                
                {area.type === 'IMAGE' && (
                  <div className="mt-1">
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor={`image-upload-${area.id}`}
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                      >
                        {customizations.find(c => c.areaId === area.id)?.value ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={customizations.find(c => c.areaId === area.id)?.value || ''}
                              alt="Uploaded image"
                              className="object-contain"
                              fill
                              sizes="(max-width: 768px) 100vw, 300px"
                            />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"
                              onClick={() => handleCustomizationChange(area.id, '')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                            </svg>
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 5MB)</p>
                          </div>
                        )}
                        <input
                          id={`image-upload-${area.id}`}
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleImageUpload(area.id, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              Total: ${totalPrice.toFixed(2)}
            </h2>
            <button
              onClick={addToCart}
              disabled={isAddingToCart}
              className={`px-6 py-3 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                isAddingToCart ? 'opacity-75 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
              }`}
            >
              {isAddingToCart ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : 'Add to Cart'}
            </button>
          </div>
          {!isAuthenticated && (
            <p className="mt-2 text-sm text-gray-500">
              You&apos;ll need to log in before adding this item to your cart.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}