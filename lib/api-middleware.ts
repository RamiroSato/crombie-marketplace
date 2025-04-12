import { NextRequest, NextResponse } from 'next/server';
import { handleError, UserInputError } from './errors';

type ApiHandler = (
  req: NextRequest,
  params?: Record<string, string | string[]>
) => Promise<NextResponse | Response>;

/**
 * Higher-order function that wraps API route handlers with error handling
 * @param handler The API route handler function
 * @returns A wrapped handler with error handling
 */
export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, params?: Record<string, string | string[]>) => {
    try {
      // Execute the original handler
      return await handler(req, params);
    } catch (error: unknown) {
      // Handle any errors using our error handling utility
      const { message, statusCode } = handleError(error);
      
      // Return an appropriate error response
      return NextResponse.json(
        { error: message },
        { status: statusCode }
      );
    }
  };
}

/**
 * Utility function to safely parse JSON from request body
 * @param req NextRequest object
 * @returns Parsed JSON data
 * @throws UserInputError if JSON parsing fails
 */
export async function parseRequestBody<T>(req: NextRequest): Promise<T> {
  try {
    return await req.json() as T;
  } catch (error) {
    throw new UserInputError('Invalid JSON in request body');
  }
}

/**
cool ahh cheat sheet:

// In the API route:
import { withErrorHandling, parseRequestBody } from '@/lib/api-middleware';
import { UserInputError } from '@/lib/errors';

export const GET = withErrorHandling(async (req) => {
  // Magic happends here B)
  const data = await fetchData();
  return NextResponse.json(data);
});

export const POST = withErrorHandling(async (req) => {
  
  const body = await parseRequestBody(req);
  
  // !!!! CHANGE THE BODYYY AND ERROR PLSSS !!!!! <---- for not forgetting :) 
  if (!body.name) {
    throw new UserInputError('Name is required');
  }
  
  const result = await createItem(body);
  return NextResponse.json(result, { status: 201 });
});


*/