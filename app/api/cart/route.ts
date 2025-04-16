// app/api/cart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, parseRequestBody } from '@/lib/api-middleware';
import { DatabaseError, AuthError, UserInputError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// Get cart items
export const GET = withErrorHandling(async (/*req: NextRequest*/) => {
  // Authenticate the user
  const user = await verifyAuth();
  
  if (!user) {
    throw new AuthError('Authentication required');
  }
  
  try {
    // Find or create a cart for the user
    let cart = await prisma.cart.findFirst({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });
    
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: user.id,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });
    }
    
    // Calculate totals and process items
    const items = cart.items.map(item => {
      // Parse customizations from JSON string if it exists
      const customizations = item.customizations 
        ? JSON.parse(item.customizations as string) 
        : [];
      
      // Calculate item total
      const itemPrice = Number(item.product.basePrice);
      
      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        customizations,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          basePrice: itemPrice,
          images: item.product.images,
          category: item.product.category,
        },
        price: itemPrice,
        total: itemPrice * item.quantity,
      };
    });
    
    // Calculate overall cart total
    const total = items.reduce((sum, item) => sum + item.total, 0);
    
    return NextResponse.json({
      id: cart.id,
      items,
      total,
      itemCount: items.length,
    });
    
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw new DatabaseError('Failed to fetch cart');
  }
});

// Add item to cart
export const POST = withErrorHandling(async (req: NextRequest) => {
  // Authenticate the user
  const user = await verifyAuth();
  
  if (!user) {
    throw new AuthError('Authentication required');
  }
  
  // Parse request body
  type Customization = Record<string, string | number | boolean>; // Define a specific type for customizations
  const body = await parseRequestBody(req) as { productId?: string; quantity?: number; customizations?: Customization[] };
  
  // Validate request data
  if (!body.productId) {
    throw new UserInputError('Product ID is required');
  }
  
  if (!body.quantity || body.quantity < 1) {
    throw new UserInputError('Valid quantity is required');
  }
  
  try {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: body.productId },
    });
    
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    
    // Find or create a cart for the user
    let cart = await prisma.cart.findFirst({
      where: { userId: user.id },
    });
    
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: user.id,
        },
      });
    }
    
    // Stringify customizations for storage
    const customizationsString = body.customizations 
      ? JSON.stringify(body.customizations) 
      : null;
    
    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: body.productId,
        customizations: customizationsString ? { equals: customizationsString } : undefined,
      },
    });
    
    if (existingItem) {
      // Update quantity if item exists
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + body.quantity,
        },
      });
    } else {
      // Create new cart item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: body.productId,
          quantity: body.quantity,
          customizations: customizationsString ? { equals: customizationsString } : undefined,
        },
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Item added to cart' 
    });
    
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UserInputError) {
      throw error;
    }
    
    console.error('Error adding item to cart:', error);
    throw new DatabaseError('Failed to add item to cart');
  }
});