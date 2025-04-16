// app/categories/[category]/page.tsx
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import SortDropdown from '@/components/ui/sort-dropdown';
import Image from 'next/image';

// Define pagination limit
const ITEMS_PER_PAGE = 12;

// Define types for params and search params
interface CategoryPageProps {
  params: {
    category: string;
  };
  searchParams: {
    page?: string;
    sort?: string;
    min?: string;
    max?: string;
    search?: string;
  };
}

interface WhereClause {
    categoryId: string;
    basePrice?: {
        gte?: number;
        lte?: number;
    };
    OR?: Array<{ name?: { contains: string; mode: string }; description?: { contains: string; mode: string } }> | undefined;
}

interface OrderByClause {
    createdAt?: 'asc' | 'desc';
    basePrice?: 'asc' | 'desc';
    name?: 'asc' | 'desc';
}

// Generate metadata dynamically
export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  // Fetch category data
  const category = await prisma.category.findUnique({
    where: {
      slug: params.category,
    },
  });

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${category.name} - Crombie Marketplace`,
    description: category.description || `Browse our collection of customizable ${category.name}`,
    openGraph: {
      title: category.name,
      description: category.description || `Browse our collection of customizable ${category.name}`,
      images: category.imageUrl ? [{ url: category.imageUrl }] : [],
    },
  };
}

// Generate static params for common categories
export async function generateStaticParams() {
  const categories = await prisma.category.findMany({
    select: {
      slug: true,
    },
  });

  return categories.map((category) => ({
    category: category.slug,
  }));
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category: categorySlug } = params;
  const page = Number(searchParams.page) || 1;
  const sort = searchParams.sort || 'newest';
  const minPrice = searchParams.min ? parseFloat(searchParams.min) : undefined;
  const maxPrice = searchParams.max ? parseFloat(searchParams.max) : undefined;
  const search = searchParams.search || '';

  // Fetch category with count of products
  const category = await prisma.category.findUnique({
    where: {
      slug: categorySlug,
    },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  if (!category) {
    notFound();
  }



  // Build where clause for filtering
  const whereClause: WhereClause = {
    categoryId: category.id,
  };

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    whereClause.basePrice = {};
    if (minPrice !== undefined) {
      whereClause.basePrice.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      whereClause.basePrice.lte = maxPrice;
    }
  }

  // Search filter
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Determine sort order
  let orderBy: OrderByClause = {};
  switch (sort) {
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
    case 'price-asc':
      orderBy = { basePrice: 'asc' };
      break;
    case 'price-desc':
      orderBy = { basePrice: 'desc' };
      break;
    case 'name-asc':
      orderBy = { name: 'asc' };
      break;
    default:
      orderBy = { createdAt: 'desc' };
  }

  // Count total products with filters
  const totalProducts = await prisma.product.count({
    where: whereClause,
  });

  // Calculate pagination values
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
  const skip = (page - 1) * ITEMS_PER_PAGE;

  // Fetch products with pagination and sorting
  const products = await prisma.product.findMany({
    where: whereClause,
    orderBy,
    skip,
    take: ITEMS_PER_PAGE,
    include: {
      customizableAreas: true,
    },
  });

  // Fetch min and max price ranges for the category
  const priceRanges = await prisma.product.aggregate({
    where: {
      categoryId: category.id,
    },
    _min: {
      basePrice: true,
    },
    _max: {
      basePrice: true,
    },
  });

  // Function to generate filter URL
  const getFilterUrl = (newParams: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    
    // Add current params
    if (searchParams.search) params.set('search', searchParams.search);
    if (searchParams.min) params.set('min', searchParams.min);
    if (searchParams.max) params.set('max', searchParams.max);
    if (searchParams.sort) params.set('sort', searchParams.sort);
    if (searchParams.page) params.set('page', searchParams.page);
    
    // Override with new params
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    
    return `?${params.toString()}`;
  };

  // Define sort options for dropdown
  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'name-asc', label: 'Name: A to Z' }
  ];

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
              <Link href="/categories" className="ml-1 text-sm text-gray-500 hover:text-gray-700 md:ml-2">
                Categories
              </Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                {category.name}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Category header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-gray-600">{category.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
            
            {/* Search */}
            <div className="mb-6">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search Products
              </label>
              <form action={`/categories/${categorySlug}`} method="get">
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="search"
                    id="search"
                    defaultValue={search}
                    className="flex-1 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Search products..."
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Search
                  </button>
                </div>
                {/* Preserve other filters */}
                {sort && <input type="hidden" name="sort" value={sort} />}
                {minPrice && <input type="hidden" name="min" value={minPrice} />}
                {maxPrice && <input type="hidden" name="max" value={maxPrice} />}
              </form>
            </div>
            
            {/* Price Range */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Price Range</h3>
              <form action={`/categories/${categorySlug}`} method="get">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="min" className="sr-only">Minimum Price</label>
                    <input
                      type="number"
                      name="min"
                      id="min"
                      defaultValue={minPrice}
                      min={Math.floor(Number(priceRanges._min.basePrice || 0))}
                      step="0.01"
                      className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Min"
                    />
                  </div>
                  <div>
                    <label htmlFor="max" className="sr-only">Maximum Price</label>
                    <input
                      type="number"
                      name="max"
                      id="max"
                      defaultValue={maxPrice}
                      max={Math.ceil(Number(priceRanges._max.basePrice || 1000))}
                      step="0.01"
                      className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Max"
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Apply
                  </button>
                </div>
                {/* Preserve other filters */}
                {sort && <input type="hidden" name="sort" value={sort} />}
                {search && <input type="hidden" name="search" value={search} />}
              </form>
            </div>
            
            {/* Clear filters */}
            <div className="border-t border-gray-200 pt-4">
              <Link
                href={`/categories/${categorySlug}`}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Clear all filters
              </Link>
            </div>
          </div>
        </div>
        
        {/* Product Grid */}
        <div className="lg:col-span-3">
          {/* Sort and results count */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium">{products.length}</span> of <span className="font-medium">{totalProducts}</span> products
            </p>
            <div className="flex items-center">
              <label htmlFor="sort" className="text-sm font-medium text-gray-700 mr-2">
                Sort by
              </label>
              {/* Use client component for the sort dropdown */}
              <SortDropdown 
                sortOptions={sortOptions}
                currentSort={sort}
                baseUrl={`/categories/${categorySlug}`}
                searchParams={Object.fromEntries(
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  Object.entries(searchParams).filter(([k, v]) => v !== undefined)
                )}
              />
            </div>
          </div>
          
          {/* Products */}
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  <Link href={`/categories/${categorySlug}/${product.slug}`}>
                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200">
                      {Array.isArray(product.images) && product.images.length > 0 ? (
                        <Image width={1000} height={1000}
                          src={typeof product.images[0] === 'string' ? product.images[0] : '/images/fallback-image.png'}
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
                      <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                      <p className="mt-1 text-lg font-medium text-gray-900">${Number(product.basePrice).toFixed(2)}</p>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {product.description || `Customizable ${product.name}`}
                      </p>
                      <div className="mt-4 flex items-center text-sm text-indigo-600">
                        <span>Customize Now</span>
                        <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your search or filter criteria.
              </p>
              <Link
                href={`/categories/${categorySlug}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                Clear all filters
              </Link>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-8">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                {/* Previous page */}
                <Link
                  href={page > 1 ? getFilterUrl({ page: page - 1 }) : '#'}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
                
                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Link
                    key={pageNum}
                    href={getFilterUrl({ page: pageNum })}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      pageNum === page ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </Link>
                ))}
                
                {/* Next page */}
                <Link
                  href={page < totalPages ? getFilterUrl({ page: page + 1 }) : '#'}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    page === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}