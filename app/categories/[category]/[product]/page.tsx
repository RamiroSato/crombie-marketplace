// app/categories/[category]/[product]/page.tsx
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import ProductCustomizer from '@/components/products/product-customizer';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

// Define types for params
interface ProductPageParams {
  params: {
    category: string;
    product: string;
  };
}

// Generate metadata dynamically
export async function generateMetadata({ params }: ProductPageParams): Promise<Metadata> {
  // Fetch product data
  const product = await prisma.product.findUnique({
    where: {
      slug: params.product,
    },
    include: {
      category: true,
    },
  });

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: `${product.name} - Crombie Marketplace`,
    description: product.description || `Customize your ${product.name} with our easy-to-use design tool.`,
    openGraph: {
      title: product.name,
      description: product.description || `Customize your ${product.name} with our easy-to-use design tool.`,
      images: Array.isArray(product.images) && product.images.length > 0 && typeof product.images[0] === 'string' 
        ? [{ url: product.images[0] }] 
        : [],
    },
  };
}

// Generate static params for common products
export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    select: {
      slug: true,
      category: {
        select: {
          slug: true,
        },
      },
    },
    take: 10, // Limit to reasonable number for static generation
  });

  return products.map((product) => ({
    category: product.category.slug,
    product: product.slug,
  }));
}

export default async function ProductPage({ params }: ProductPageParams) {
  // Fetch product with related data
  const product = await prisma.product.findUnique({
    where: {
      slug: params.product,
    },
    include: {
      category: true,
      customizableAreas: true,
    },
  });

  // Check if product exists and category matches
  if (!product || product.category.slug !== params.category) {
    notFound();
  }

  // Fetch related products in the same category
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: {
        not: product.id, // Exclude current product
      },
    },
    take: 4,
    include: {
      category: true,
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumbs */}
      <nav className="flex mb-8" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              Home
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <a href={`/categories/${product.category.slug}`} className="ml-1 text-sm text-gray-500 hover:text-gray-700 md:ml-2">
                {product.category.name}
              </a>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                {product.name}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Product customizer component (client component) */}
      <ProductCustomizer product={{ 
        ...product, 
        basePrice: Number(product.basePrice), 
        images: Array.isArray(product.images) ? product.images.filter((img): img is string => typeof img === 'string') : [],
        customizableAreas: product.customizableAreas.map(area => ({
          ...area,
          extraCharge: area.extraCharge ? Number(area.extraCharge) : null,
        }))
      }} />

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">You may also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <a
                key={relatedProduct.id}
                href={`/categories/${relatedProduct.category.slug}/${relatedProduct.slug}`}
                className="group"
              >
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
                  {Array.isArray(relatedProduct.images) && relatedProduct.images.length > 0 ? (
                    <Image width={1000} height={1000}
                      src={typeof relatedProduct.images[0] === 'string' ? relatedProduct.images[0] : 'images'}
                      alt={relatedProduct.name}
                      className="h-full w-full object-cover object-center group-hover:opacity-75"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-100">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                <h3 className="mt-4 text-base font-medium text-gray-900">{relatedProduct.name}</h3>
                <p className="mt-1 text-lg font-medium text-gray-900">${relatedProduct.basePrice.toFixed(2)}</p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}