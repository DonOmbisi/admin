import React from 'react';
import { useAdminService } from '../context/AdminServiceContext';
import { Plus, Edit, Trash2 } from 'lucide-react';

const CategoriesPage: React.FC = () => {
  const { categories, deleteCategory } = useAdminService();

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      try {
        await deleteCategory(categoryId);
        alert('Category deleted successfully');
      } catch (error) {
        alert('Failed to delete category');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Manage product categories</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Categories</h3>
        </div>
        
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {categories.map((category) => (
              <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">{category.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">Slug: {category.slug}</p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(category.id, category.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
