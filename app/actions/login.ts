// app/actions/login.ts
'use server'

import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { loginSchema, type LoginFormData } from '@/lib/validation';
import { setUserCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginUser(formData: LoginFormData) {
  // Validate form data
  const result = loginSchema.safeParse(formData);
  
  if (!result.success) {
    return {
      success: false,
      message: 'Invalid form data',
      errors: result.error.flatten().fieldErrors,
    };
  }
  
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: formData.email },
    });
    
    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }
    
    // Compare the passwords
    const passwordMatch = await bcrypt.compare(formData.password, user.password);
    
    if (!passwordMatch) {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }
    
    // Set the user cookie with JWT
    await setUserCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    
    // Redirect to home page
    redirect('/');
    
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'An error occurred during login',
    };
  }
}