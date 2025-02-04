'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../../config/api';

interface Order {
  id: number;
  product: {
    name: string;
    price: number;
  };
  buyer: {
    email: string;
  };
  quantity: number;
  amount: number;
  status: string;
  shippingAddress: string;
  trackingNumber: string;
  invoiceNumber: string;
  createdAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await api.get('/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        toast.error('Failed to fetch orders');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to update order status');
        router.push('/login');
        return;
      }

      // Store the original status before update
      const originalOrder = orders.find(o => o.id === orderId);
      if (!originalOrder) {
        toast.error('Order not found');
        return;
      }

      // Optimistically update the UI
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));

      console.log('Updating order status:', { orderId, newStatus });
      const response = await api.patch(
        `/orders/${orderId}`,
        { status: newStatus },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      console.log('Update response:', response.data);
      toast.success('Order status updated successfully');
      
      // Update the orders list with the new data
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, ...response.data }
          : order
      ));
    } catch (error: any) {
      console.error('Error updating order status:', error);
      
      // Revert the optimistic update
      const originalOrder = orders.find(o => o.id === orderId);
      if (originalOrder) {
        setOrders(orders.map(order => 
          order.id === orderId 
            ? originalOrder
            : order
        ));

        // Update the select element
        const select = document.getElementById(`status-${orderId}`) as HTMLSelectElement;
        if (select) {
          select.value = originalOrder.status;
        }
      }

      // Show appropriate error message
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please refresh the page to continue.');
        // Don't redirect, just show a refresh button
        const shouldRefresh = window.confirm('Would you like to refresh the page now?');
        if (shouldRefresh) {
          window.location.reload();
        }
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to update order status. Please try again.');
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const generateInvoice = async (orderId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await api.get(`/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success('Invoice generated successfully');
      console.log('Invoice data:', response.data);
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please refresh the page and login again.');
      } else {
        toast.error('Failed to generate invoice');
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Processing: 'bg-blue-100 text-blue-800',
      Shipped: 'bg-purple-100 text-purple-800',
      Delivered: 'bg-green-100 text-green-800',
      Canceled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {orders.map((order) => (
                <li key={order.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                          Order #{order.id}
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Product</p>
                          <p className="mt-1 text-base text-gray-900">{order.product.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Quantity</p>
                          <p className="mt-1 text-base text-gray-900">{order.quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Amount</p>
                          <p className="mt-1 text-base text-gray-900">${Number(order.amount).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Customer Email</p>
                          <p className="mt-1 text-base text-gray-900">{order.buyer.email}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Shipping Address</p>
                          <p className="mt-1 text-base text-gray-900">{order.shippingAddress}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Order Date</p>
                          <p className="mt-1 text-base text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <div className="flex-1 max-w-xs relative">
                      <select
                        id={`status-${order.id}`}
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        disabled={updatingOrderId === order.id}
                        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${
                          updatingOrderId === order.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Canceled">Canceled</option>
                      </select>
                      {updatingOrderId === order.id && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                        </div>
                      )}
                    </div>

                    {order.status === 'Delivered' && (
                      <button
                        onClick={() => generateInvoice(order.id)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Generate Invoice
                      </button>
                    )}
                  </div>

                  {order.trackingNumber && (
                    <div className="mt-4 bg-gray-50 rounded-md p-4">
                      <p className="text-sm font-medium text-gray-500">
                        Tracking Number
                      </p>
                      <p className="mt-1 text-base text-gray-900">
                        {order.trackingNumber}
                      </p>
                    </div>
                  )}

                  {order.invoiceNumber && (
                    <div className="mt-4 bg-gray-50 rounded-md p-4">
                      <p className="text-sm font-medium text-gray-500">
                        Invoice Number
                      </p>
                      <p className="mt-1 text-base text-gray-900">
                        {order.invoiceNumber}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 