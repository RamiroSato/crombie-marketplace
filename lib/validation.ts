// lib/validation.ts
import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[\W_]/, { message: 'Password must contain at least one special character' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const productSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  slug: z.string().min(2, { message: 'Slug must be at least 2 characters' }),
  description: z.string().optional(),
  basePrice: z.coerce.number().positive({ message: 'Price must be positive' }),
  categoryId: z.string().min(1, { message: 'Category is required' }),
  images: z.array(z.string()).optional(),
  customizableAreas: z.array(z.object({
    name: z.string().min(1, { message: 'Area name is required' }),
    type: z.enum(['TEXT', 'IMAGE', 'COLOR']),
    extraCharge: z.coerce.number().optional(),
  })).optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;