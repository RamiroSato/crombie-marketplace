// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, parseRequestBody } from '@/lib/api-middleware';
import { DatabaseError, AuthError, UserInputError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// POST handler to create an order from a cart
export const POST = withErrorHandling(async (req: NextRequest) => {
  // Authenticate the user
  const user = await verifyAuth();
  
  if (!user) {
    throw new AuthError('Authentication required');
  }
  
  // Parse request body
  const body = await parseRequestBody(req) as { 
    cartId: string; 
    shippingInfo: {
      fullName: string;
      email: string;
      address: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      phone: string;
    };
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  
  // Validate request data
  if (!body.cartId) {
    throw new UserInputError('Cart ID is required');
  }

  if (!body.shippingInfo) {
    throw new UserInputError('Shipping information is required');
  }
  
  try {
    // Verify the cart belongs to the user
    const cart = await prisma.cart.findUnique({
      where: { id: body.cartId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
    
    if (!cart) {
      throw new NotFoundError('Cart not found');
    }
    
    if (cart.userId !== user.id) {
      throw new AuthError('You do not have permission to checkout this cart');
    }
    
    // Verify the cart has items
    if (!cart.items || cart.items.length === 0) {
      throw new UserInputError('Cannot checkout an empty cart');
    }
    
    // Create the order with transaction to ensure all operations complete or roll back
    const result = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          userId: user.id,
          status: 'PENDING',
          total: body.total,
          // Store shipping information as metadata in the order items
        }
      });
      
      // Create order items from cart items
      const orderItems = await Promise.all(
        cart.items.map(async (item) => {
          // Add shipping info to the first item's customizations
          const customizations = item.customizations ? 
            JSON.parse(typeof item.customizations === 'string' ? item.customizations : JSON.stringify(item.customizations)) : 
            [];

          // Only add shipping info to the first item to avoid duplication
          const itemWithShippingInfo = cart.items.indexOf(item) === 0 ? 
            {
              ...customizations,
              _shippingInfo: body.shippingInfo // Use underscore to distinguish from regular customizations
            } : 
            customizations;

          return tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              quantity: item.quantity,
              price: Number(item.product.basePrice),
              customizations: itemWithShippingInfo,
            }
          });
        })
      );
      
      // Delete the cart items
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
      
      return { order, orderItems };
    });
    
    return NextResponse.json({
      id: result.order.id,
      status: result.order.status,
      total: result.order.total,
      createdAt: result.order.createdAt,
    }, { status: 201 });
    
  } catch (error) {
    // Re-throw specific errors
    if (
      error instanceof NotFoundError || 
      error instanceof UserInputError || 
      error instanceof AuthError
    ) {
      throw error;
    }
    
    console.error('Error processing checkout:', error);
    throw new DatabaseError('Failed to process checkout');
  }
});