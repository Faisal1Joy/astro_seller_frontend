'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../../config/api';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  stock: number;
  images: string[];
  isActive: boolean;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<{id: number, price: string, stock: string} | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    images: [] as string[],
  });

  // Add state for storing actual files
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [orderForm, setOrderForm] = useState({
    productId: null as number | null,
    quantity: 1,
    shippingAddress: '',
  });
  const [showOrderForm, setShowOrderForm] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await api.get('/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // First, upload the images
      const uploadFormData = new FormData();
      imageFiles.forEach(file => {
        uploadFormData.append('files', file);
      });

      // Upload the files first
      const uploadResponse = await api.post('/products/upload', uploadFormData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      });

      // Get the URLs of the uploaded files
      const imageUrls = uploadResponse.data.urls;

      // Then create the product with the image URLs
      const productData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        category: formData.category,
        stock: Number(formData.stock),
        images: imageUrls
      };

      await api.post('/products', productData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      // Cleanup blob URLs
      formData.images.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      
      toast.success('Product created successfully');
      setShowForm(false);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        images: [],
      });
      setImageFiles([]);
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        router.push('/login');
        return;
      }

      const response = await api.delete(`/products/${id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.message) {
        toast.success(response.data.message);
        // Remove the product from local state immediately
        setProducts(products => products.filter(p => p.id !== id));
      }
    } catch (error: any) {
      console.error('Error deleting product:', error);
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Failed to delete product';
      toast.error(errorMessage);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await api.patch(
        `/products/${id}/toggle`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success('Product status updated');
      fetchProducts();
    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error('Failed to update product status');
    }
  };

  const handleStartEdit = (product: Product) => {
    setEditingProduct({
      id: product.id,
      price: product.price.toString(),
      stock: product.stock.toString()
    });
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    try {
      const token = localStorage.getItem('token');
      await api.patch(
        `/products/${editingProduct.id}`,
        {
          price: Number(editingProduct.price),
          stock: Number(editingProduct.stock)
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success('Product updated successfully');
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Cleanup existing blob URLs
    formData.images.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });

    // Create new blob URLs and store files
    const newFiles = Array.from(files);
    const imageUrls = newFiles.map(file => URL.createObjectURL(file));
    
    setImageFiles(prev => [...prev, ...newFiles]);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...imageUrls],
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            {showForm ? 'Cancel' : 'Add Product'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock</label>
                  <input
                    type="number"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="mt-1 block w-full"
                  onChange={handleImageUpload}
                />
                {formData.images.length > 0 && (
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {formData.images.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Create Product
              </button>
            </form>
          </div>
        )}

        <div className="space-y-8">
          {Array.from(new Set(products.map(p => p.category))).map(category => (
            <div key={category} className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">{category}</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.filter(p => p.category === category).map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow p-6">
                    {product.images && product.images.length > 0 && (
                      <div className="aspect-w-16 aspect-h-9 mb-4">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                    <p className="mt-2 text-gray-600">{product.description}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <div>
                        {editingProduct?.id === product.id ? (
                          <div className="space-y-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Price</label>
                              <input
                                type="number"
                                step="0.01"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={editingProduct.price}
                                onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Stock</label>
                              <input
                                type="number"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={editingProduct.stock}
                                onChange={(e) => setEditingProduct({...editingProduct, stock: e.target.value})}
                              />
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={handleSaveEdit}
                                className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm hover:bg-green-200"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-lg font-bold text-gray-900">
                              ${product.discountPrice || product.price}
                            </p>
                            {product.discountPrice && (
                              <p className="text-sm text-gray-500 line-through">
                                ${product.price}
                              </p>
                            )}
                            <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                            <button
                              onClick={() => handleStartEdit(product)}
                              className="mt-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm hover:bg-blue-200"
                            >
                              Edit Price/Stock
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleActive(product.id)}
                          className={`px-3 py-1 rounded-md text-sm ${
                            product.isActive
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {product.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-sm hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}