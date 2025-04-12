// lib/auth.ts
import { jwtVerify, SignJWT } from 'jose'; //why jose thou? Does he sells tacos?
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// Secret key for JWT signing
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'cool-ahh-secret-key-min-32-chars-long!!' //absolutely needed name btw
);

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  [key: string]: unknown; // Add index signature to match jose's JWTPayload
}

// Set a JWT token as a cookie
export async function setUserCookie(payload: JWTPayload) {
  // Create a JWT that expires in 2 weeks
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('14d')
    .sign(JWT_SECRET);

  // Set the JWT as an HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set({
    name: 'auth-token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 14, // 14 days in seconds
    path: '/',
  });

  return token;
}

// Remove the JWT cookie
export async function removeUserCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}

// Verify the JWT token from the cookie
export async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    return payload as JWTPayload;
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
}

// Get the user from a request (for middleware)
export async function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get('auth-token');

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    return payload as JWTPayload;
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
}