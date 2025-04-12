// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { removeUserCookie } from '@/lib/auth';

export async function POST() {
  try {
    // Remove the authentication cookie
    removeUserCookie();
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Error during logout' },
      { status: 500 }
    );
  }
}