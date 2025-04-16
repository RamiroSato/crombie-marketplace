import { verifyAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'My Profile - Crombie Marketplace',
  description: 'View and manage your account information and orders.',
};

export default async function ProfilePage() {
  // Verify authentication (middleware also handles this, but we need the user data)
  const user = await verifyAuth();
  
  if (!user) {
    redirect('/login?callbackUrl=/profile');
  }
  
  // Get user data from database (to get the latest information)
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });
  
  if (!userData) {
    // Handle case where user exists in JWT but not in DB (should be rare)
    redirect('/login?callbackUrl=/profile');
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and preferences</p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{userData.name}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{userData.email}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Account type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {userData.role === 'ADMIN' ? 'Administrator' : 'Customer'}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Member since</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {new Date(userData.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Orders</h2>
        
        {userData.orders.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {userData.orders.map((order) => (
                <li key={order.id} className="p-4 hover:bg-gray-50">
                  <a href={`/orders/${order.id}`} className="block">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-indigo-600">
                          Order #{order.id.substring(0, 8)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                        </span>
                        <p className="mt-1 text-sm text-gray-900 font-medium">
                          ${order.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}:
                        {' '}
                        {order.items.map(item => item.product.name).join(', ')}
                      </p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
            <div className="bg-gray-50 px-4 py-4 border-t border-gray-200 sm:px-6">
              <a href="/orders" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View all orders
                <span aria-hidden="true"> &rarr;</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
            <p className="text-gray-500">You haven&apos;t placed any orders yet.</p>
            <Link href="/categories" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Start shopping
              <span aria-hidden="true"> &rarr;</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}