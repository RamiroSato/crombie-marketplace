// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, parseRequestBody } from '@/lib/api-middleware';
import { DatabaseError, NotFoundError, UserInputError } from '@/lib/errors';
import { prisma } from '@/lib/db';
import { productSchema } from '@/lib/validation';
import { Prisma } from '@prisma/client';

// Helper function to handle pagination
const getPaginationParams = (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const skip = (page - 1) * limit;
  
  // Validate pagination parameters
  if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 100) {
    throw new UserInputError('Invalid pagination parameters');
  }
  
  return { skip, take: limit, page };
};

// GET handler with pagination and filtering
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { skip, take, page } = getPaginationParams(req);
  const searchParams = req.nextUrl.searchParams;
  
  // Build where clause for filtering
  const whereClause: Prisma.ProductWhereInput = {};
  
  // Filter by category
  const category = searchParams.get('category');
  if (category) {
    whereClause.category = {
      slug: category
    };
  }
  
  // Filter by name search
  const search = searchParams.get('search');
  if (search) {
    whereClause.OR = [
      { name: { contains: search } },
      { description: { contains: search } }
    ];
  }
  
  // Price range filter
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  
  if (minPrice || maxPrice) {
    whereClause.basePrice = {};
    
    if (minPrice) {
      const min = parseFloat(minPrice);
      if (isNaN(min)) {
        throw new UserInputError('Invalid minimum price');
      }
      whereClause.basePrice.gte = min;
    }
    
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (isNaN(max)) {
        throw new UserInputError('Invalid maximum price');
      }
      whereClause.basePrice.lte = max;
    }
  }
  
  try {
    // Get total count for pagination
    const total = await prisma.product.count({ where: whereClause });
    
    // Get products with pagination
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        customizableAreas: true,
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / take);
    const hasMore = page < totalPages;
    
    return NextResponse.json({
      products,
      pagination: {
        page,
        limit: take,
        total,
        totalPages,
        hasMore,
      },
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new DatabaseError('Failed to fetch products');
  }
});

// POST handler to create a product
export const POST = withErrorHandling(async (req: NextRequest) => {
  // Parse request body
  const body = await parseRequestBody(req);
  
  // Validate product data
  const validationResult = productSchema.safeParse(body);
  
  if (!validationResult.success) {
    throw new UserInputError(validationResult.error.message);
  }
  
  const productData = validationResult.data;
  
  try {
    // Check if the category exists
    const category = await prisma.category.findUnique({
      where: { id: productData.categoryId },
    });
    
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    
    // Check if slug is unique
    const existingProduct = await prisma.product.findUnique({
      where: { slug: productData.slug },
    });
    
    if (existingProduct) {
      throw new UserInputError('A product with this slug already exists');
    }
    
    // Create the product
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        slug: productData.slug,
        description: productData.description,
        basePrice: productData.basePrice,
        images: productData.images || [],
        categoryId: productData.categoryId,
        customizableAreas: {
          create: productData.customizableAreas || [],
        },
      },
      include: {
        category: true,
        customizableAreas: true,
      },
    });
    
    return NextResponse.json(product, { status: 201 });
    
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new UserInputError('A product with this slug already exists');
      }
    }
    
    // Re-throw custom errors
    if (error instanceof NotFoundError || error instanceof UserInputError) {
      throw error;
    }
    
    // Otherwise treat as a database error
    console.error('Error creating product:', error);
    throw new DatabaseError('Failed to create product');
  }
});