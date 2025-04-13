// components/layout/footer.tsx
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Crombie Marketplace</h2>
            <p className="text-gray-600 mb-4">
              Create and purchase customized products including t-shirts, mugs, and posters.
              Express yourself with unique designs tailored to your preferences.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Shop</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/categories" className="text-base text-gray-500 hover:text-gray-900">
                  All Categories
                </Link>
              </li>
              <li>
                <Link href="/categories/t-shirts" className="text-base text-gray-500 hover:text-gray-900">
                  T-Shirts
                </Link>
              </li>
              <li>
                <Link href="/categories/mugs" className="text-base text-gray-500 hover:text-gray-900">
                  Mugs
                </Link>
              </li>
              <li>
                <Link href="/categories/posters" className="text-base text-gray-500 hover:text-gray-900">
                  Posters
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Account</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/profile" className="text-base text-gray-500 hover:text-gray-900">
                  My Profile
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-base text-gray-500 hover:text-gray-900">
                  Order History
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-base text-gray-500 hover:text-gray-900">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-base text-gray-400 text-center">
            &copy; {currentYear} Crombie Marketplace. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}