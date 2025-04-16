// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-middleware';
import { DatabaseError, AuthError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// GET handler to retrieve a specific order
export const GET = withErrorHandling(async (
  req: NextRequest,
) => {
    const url = new URL(req.url);
    const id = url.pathname.split('orders/').pop(); // Get the last segment of the path
    //remove the trailing slash if it exists
  
    console.log('Extracted id:', id);
  
  
  
  if (!id) {
    throw new NotFoundError('Order ID is required');
  }

  // Authenticate the user
  const user = await verifyAuth();
  
  if (!user) {
    throw new AuthError('Authentication required');
  }
  
  try {
    // Find the order with related data
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    
    // Check if the order belongs to the user
    if (order.userId !== user.id && user.role !== 'ADMIN') {
      throw new AuthError('You do not have permission to view this order');
    }
    
    // Extract shipping info from the first order item's customizations
    let shippingInfo = null;
    for (const item of order.items) {
      const customizationsData = item.customizations;
      if (customizationsData && typeof customizationsData === 'object') {
        const customizations = typeof customizationsData === 'string' 
          ? JSON.parse(customizationsData) 
          : customizationsData;
        
        if (customizations._shippingInfo) {
          shippingInfo = customizations._shippingInfo;
          break;
        }
      }
    }
    
    // Format and return the order data
    return NextResponse.json({
      id: order.id,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        id: item.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        customizations: item.customizations,
      })),
      shippingInfo: shippingInfo || {
        fullName: "Not provided",
        email: "Not provided",
        address: "Not provided",
        city: "Not provided",
        state: "Not provided",
        zipCode: "Not provided",
        country: "Not provided"
      },
    });
    
  } catch (error) {
    // Re-throw specific errors
    if (
      error instanceof NotFoundError || 
      error instanceof AuthError
    ) {
      throw error;
    }
    
    console.error('Error fetching order:', error);
    throw new DatabaseError('Failed to fetch order');
  }
});