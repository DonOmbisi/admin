import React from 'react';
import { useAdminService } from '../context/AdminServiceContext';
import { Package, ShoppingCart, Users, DollarSign } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { products } = useAdminService();

  const stats = [
    {
      label: 'Total Products',
      value: products.length,
      icon: Package,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'increase'
    },
    {
      label: 'Total Orders',
      value: '1,234',
      icon: ShoppingCart,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'increase'
    },
    {
      label: 'Total Users',
      value: '5,678',
      icon: Users,
      color: 'bg-purple-500',
      change: '+23%',
      changeType: 'increase'
    },
    {
      label: 'Revenue',
      value: '$45,678',
      icon: DollarSign,
      color: 'bg-pink-500',
      change: '+15%',
      changeType: 'increase'
    }
  ];

  const recentProducts = products.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change} from last month
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Products */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Products</h3>
        </div>
        <div className="overflow-hidden">
          {recentProducts.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {recentProducts.map((product) => (
                <div key={product.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${product.price}</p>
                      <p className={`text-xs ${
                        product.inStock ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new product.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
