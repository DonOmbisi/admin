import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  salePrice?: number;
  badge?: string;
  featured?: boolean;
  category: string;
  subcategory: string;
  colors: string[];
  sizes: string[];
  images: string[];
  description: string;
  features: string[];
  isNew: boolean;
  isBestseller: boolean;
  inStock: boolean;
  sku?: string;
  isActive?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface AdminServiceContextType {
  isAdmin: boolean;
  user: User | null;
  products: Product[];
  categories: Category[];
  subcategories: Subcategory[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchSubcategories: () => Promise<void>;
  loginAsAdmin: (email: string, password: string) => Promise<boolean>;
  logoutAdmin: () => void;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  deleteMultipleProducts: (ids: string[]) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addSubcategory: (subcategory: Omit<Subcategory, 'id'>) => Promise<void>;
  deleteSubcategory: (id: string) => Promise<void>;
  viewProduct: (productId: string) => void;
  editProduct: (productId: string) => void;
  selectedProduct: Product | null;
  isEditing: boolean;
}

const AdminServiceContext = createContext<AdminServiceContextType | null>(null);

export const useAdminService = () => {
  const context = useContext(AdminServiceContext);
  if (!context) {
    throw new Error('useAdminService must be used within AdminServiceProvider');
  }
  return context;
};

export const AdminServiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // API base URL - use environment variable for separate deployment
  const API_BASE = import.meta.env.VITE_ADMIN_API_URL ||
    (import.meta.env.PROD
      ? 'https://admin-service-xq0t.onrender.com'  // ← Replace with your admin service URL
      : 'http://localhost:3002');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loginAsAdmin = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('adminToken', data.token);
        setUser(data.user);
        setIsAdmin(true);
        return true;
      } else {
        const errorData = await res.json();
        console.error('Login failed:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    setUser(null);
    localStorage.removeItem('adminToken');
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/products?limit=100`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/subcategories`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setSubcategories(data);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(product)
      });
      await fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
    try {
      await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(product)
      });
      await fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      console.log('Deleting product:', id);
      const response = await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete error:', errorData);
        throw new Error(errorData.error || 'Failed to delete product');
      }
      
      console.log('Product deleted successfully');
      await fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  const deleteMultipleProducts = async (ids: string[]) => {
    try {
      console.log('Bulk delete request for IDs:', ids);
      const response = await fetch(`${API_BASE}/api/products/bulk-delete`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Bulk delete error response:', errorData);
        throw new Error(errorData.error || 'Failed to delete products');
      }
      
      const result = await response.json();
      console.log('Bulk delete success:', result);
      await fetchProducts();
    } catch (error) {
      console.error('Error deleting multiple products:', error);
      throw error;
    }
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    try {
      await fetch(`${API_BASE}/api/categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(category)
      });
      await fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      await fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  const addSubcategory = async (subcategory: Omit<Subcategory, 'id'>) => {
    try {
      await fetch(`${API_BASE}/api/subcategories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(subcategory)
      });
      await fetchSubcategories();
    } catch (error) {
      console.error('Error adding subcategory:', error);
      throw error;
    }
  };

  const deleteSubcategory = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/subcategories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      await fetchSubcategories();
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      throw error;
    }
  };

  const viewProduct = (productId: string) => {
    const product = products.find((product) => product.id === productId);
    if (product) {
      setSelectedProduct(product);
      setIsEditing(false);
    }
  };

  const editProduct = (productId: string) => {
    const product = products.find((product) => product.id === productId);
    if (product) {
      setSelectedProduct(product);
      setIsEditing(true);
    }
  };

  // Check for existing admin token on initialization
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      fetch(`${API_BASE}/api/products`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.ok) {
          setIsAdmin(true);
          try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            setUser({ 
              id: decoded.userId || decoded.sub,
              email: decoded.email, 
              name: decoded.name || `${decoded.firstName || ''} ${decoded.lastName || ''}`.trim(),
              firstName: decoded.firstName,
              lastName: decoded.lastName,
              role: decoded.role 
            });
          } catch (e) {
            console.error('Failed to decode token:', e);
          }
        } else {
          localStorage.removeItem('adminToken');
        }
      })
      .catch(() => {
        localStorage.removeItem('adminToken');
      });
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
      fetchCategories();
      fetchSubcategories();
    }
  }, [isAdmin]);

  return (
    <AdminServiceContext.Provider value={{
      isAdmin,
      user,
      products,
      categories,
      subcategories,
      setProducts,
      fetchProducts,
      fetchCategories,
      fetchSubcategories,
      loginAsAdmin,
      logoutAdmin,
      addProduct,
      updateProduct,
      deleteProduct,
      deleteMultipleProducts,
      addCategory,
      deleteCategory,
      addSubcategory,
      deleteSubcategory,
      viewProduct,
      editProduct,
      selectedProduct,
      isEditing
    }}>
      {children}
    </AdminServiceContext.Provider>
  );
};
