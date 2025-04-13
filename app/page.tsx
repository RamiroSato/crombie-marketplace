// app/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crombie Marketplace',
  description: 'Create and purchase customized products including t-shirts, mugs, and posters.',
};

// Revalidate the page every hour
export const revalidate = 3600;

export default async function HomePage() {
  // Fetch featured categories
  const categories = await prisma.category.findMany({
    take: 3,
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
  
  // Fetch latest products
  const latestProducts = await prisma.product.findMany({
    take: 4,
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
    },
  });
  
  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-indigo-800">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover"
            src="/images/hero-bg.jpg"
            alt="Personalized Products"
          />
          <div className="absolute inset-0 bg-gray-200 mix-blend-multiply" aria-hidden="true"></div>
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Express Yourself with Custom Products
          </h1>
          <p className="mt-6 text-xl text-indigo-100 max-w-3xl">
            Create personalized t-shirts, mugs, and posters with your own designs, text, and colors.
            Perfect for gifts, special occasions, or just treating yourself.
          </p>
          <div className="mt-10">
            <Link
              href="/categories"
              className="inline-block bg-white py-3 px-8 border border-transparent rounded-md text-base font-medium text-indigo-700 hover:bg-indigo-50"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
      
      {/* Featured Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
          Shop by Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group relative rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
            >
              <div className="aspect-w-4 aspect-h-3 bg-gray-200">
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="w-full h-full object-center object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400">{category.name}</span>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 flex items-end p-4 bg-gradient-to-t from-black/60 to-transparent">
                <div>
                  <h3 className="text-xl font-bold text-white">{category.name}</h3>
                  <p className="text-sm text-gray-200">
                    {category._count.products} products
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/categories"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            View All Categories
          </Link>
        </div>
      </div>
      
      {/* Latest Products */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
            Our Latest Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {latestProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200">
                  {Array.isArray(product.images) && product.images.length > 0 ? (
                    <img
                      src={typeof product.images[0] === 'string' ? product.images[0] : undefined}
                      alt={product.name}
                      className="w-full h-full object-center object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm text-indigo-600 mb-1">
                    {product.category.name}
                  </p>
                  <h3 className="text-lg font-medium text-gray-900">
                    <Link href={`/categories/${product.category.slug}/${product.slug}`}>
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-lg font-medium text-gray-900">
                    ${product.basePrice.toFixed(2)}
                  </p>
                  <div className="mt-4">
                    <Link
                      href={`/categories/${product.category.slug}/${product.slug}`}
                      className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
                    >
                      Customize Now <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/categories"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              View All Products
            </Link>
          </div>
        </div>
      </div>
      
      {/* How It Works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">1. Choose a Product</h3>
            <p className="text-gray-500">
              Browse our collection of customizable products and select the one you like.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">2. Personalize It</h3>
            <p className="text-gray-500">
              Add your text, upload images, and choose colors to make it uniquely yours.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">3. Receive Your Order</h3>
            <p className="text-gray-500">
              We'll produce your custom item and deliver it right to your doorstep.
            </p>
          </div>
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="bg-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-3xl font-extrabold text-white">
            Ready to create your personalized product?
          </h2>
          <p className="mt-4 text-xl text-indigo-100">
            Start designing today and express your creativity.
          </p>
          <div className="mt-8">
            <Link
              href="/categories"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}