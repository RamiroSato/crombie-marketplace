import { prisma } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Categories - Crombie Marketplace',
  description: 'Browse all categories of customizable products available in our marketplace.',
};

// Revalidate every hour
export const revalidate = 3600;

export default async function CategoriesPage() {
  // Fetch all categories with product counts
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          All Categories
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
          Browse our collection of customizable products by category
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="group relative rounded-lg overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="aspect-w-3 aspect-h-2 bg-gray-200">
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-full h-full object-center object-cover group-hover:opacity-90 transition-opacity"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400">{category.name}</span>
                </div>
              )}
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {category.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {category._count.products} products
              </p>
              {category.description && (
                <p className="mt-3 text-base text-gray-500 line-clamp-2">
                  {category.description}
                </p>
              )}
              <div className="mt-4 flex items-center text-sm font-medium text-indigo-600">
                View Category
                <svg
                  className="ml-1 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* If no categories */}
      {categories.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-gray-900">No categories found</h2>
          <p className="mt-2 text-gray-500">Please check back later for our product offerings.</p>
        </div>
      )}
      
      {/* Call to action */}
      <div className="mt-16 bg-indigo-100 rounded-lg p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-indigo-900">Ready to create your custom design?</h2>
          <p className="mt-3 text-lg text-indigo-700">
            Choose from a variety of products and add your personal touch to create something unique.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}