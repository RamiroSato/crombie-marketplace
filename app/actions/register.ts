// app/actions/register.ts
'use server'

import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { registerSchema, type RegisterFormData } from '@/lib/validation';
import { setUserCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function registerUser(formData: RegisterFormData) {
  // Validate form data
  const result = registerSchema.safeParse(formData);
  
  if (!result.success) {
    return {
      success: false,
      message: 'Invalid form data',
      errors: result.error.flatten().fieldErrors,
    };
  }
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: formData.email },
    });
    
    if (existingUser) {
      return {
        success: false,
        message: 'User with this email already exists',
      };
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(formData.password, 10);
    
    // Create the user
    const user = await prisma.user.create({
      data: {
        name: formData.name,
        email: formData.email,
        password: hashedPassword,
        role: 'USER', // Default role
      },
    });
    
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
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'An error occurred during registration',
    };
  }
}