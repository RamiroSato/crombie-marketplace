// app/register/page.tsx
// import RegisterForm from '@/components/auth/register-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account - Crombie Marketplace',
  description: 'Create a new account to start ordering personalized products.',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">
          Crombie Marketplace
        </h1>
        <h2 className="mt-3 text-center text-xl text-gray-600">
          Create a new account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* <RegisterForm /> */}
      </div>
    </div>
  );
}