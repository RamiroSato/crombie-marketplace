// app/api/cart/items/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, parseRequestBody } from '@/lib/api-middleware';
import { DatabaseError, AuthError, UserInputError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// Update cart item
export const PUT = withErrorHandling(async (
  req: NextRequest,
  params?: Record<string, string | string[]>
) => {
  const { id } = params as { id: string };

  // Authenticate the user
  const user = await verifyAuth();
  
  if (!user) {
    throw new AuthError('Authentication required');
  }
  
  // Parse request body
  const body = await parseRequestBody(req) as { quantity: number };
  
  // Validate request data
  if (!body.quantity || body.quantity < 0) {
    throw new UserInputError('Valid quantity is required');
  }
  
  try {
    // Find the cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
      },
    });
    
    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }
    
    // Check if the cart belongs to the user
    if (cartItem.cart.userId !== user.id) {
      throw new AuthError('You do not have permission to update this cart item');
    }
    
    // If quantity is 0, delete the item
    if (body.quantity === 0) {
      await prisma.cartItem.delete({
        where: { id },
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Item removed from cart' 
      });
    }
    
    // Update the cart item quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id },
      data: {
        quantity: body.quantity,
      },
      include: {
        product: true,
      },
    });
    
    // Calculate item total
    const itemPrice = Number(updatedItem.product.basePrice);
    const total = itemPrice * updatedItem.quantity;
    
    return NextResponse.json({
      id: updatedItem.id,
      quantity: updatedItem.quantity,
      price: itemPrice,
      total,
    });
    
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UserInputError || error instanceof AuthError) {
      throw error;
    }
    
    console.error('Error updating cart item:', error);
    throw new DatabaseError('Failed to update cart item');
  }
});

// Delete cart item
export const DELETE = withErrorHandling(async (
  req: NextRequest,
  params?: Record<string, string | string[]>
) => {
  const { id } = params as { id: string };

  // Authenticate the user
  const user = await verifyAuth();
  
  if (!user) {
    throw new AuthError('Authentication required');
  }
  
  try {
    // Find the cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
      },
    });
    
    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }
    
    // Check if the cart belongs to the user
    if (cartItem.cart.userId !== user.id) {
      throw new AuthError('You do not have permission to delete this cart item');
    }
    
    // Delete the cart item
    await prisma.cartItem.delete({
      where: { id },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Item removed from cart' 
    });
    
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthError) {
      throw error;
    }
    
    console.error('Error deleting cart item:', error);
    throw new DatabaseError('Failed to delete cart item');
  }
});