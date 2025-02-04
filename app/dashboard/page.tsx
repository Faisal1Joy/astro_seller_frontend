'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import api from '../config/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    recentSales: [],
    monthlyEarnings: []
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/seller/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashboardData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [router]);

  // Sample data for charts
  const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Monthly Sales',
        data: [65, 59, 80, 81, 56, 55],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const earningsData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Monthly Earnings',
        data: [4500, 5900, 8000, 8100, 5600, 5500],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Seller Dashboard</h1>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Total Sales</h2>
            <p className="text-3xl font-bold text-indigo-600">{dashboardData.totalSales}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Pending Orders</h2>
            <p className="text-3xl font-bold text-orange-600">{dashboardData.pendingOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Total Earnings</h2>
            <p className="text-3xl font-bold text-green-600">${dashboardData.totalEarnings}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Sales Trend</h2>
            <Line data={salesData} options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: true,
                  text: 'Monthly Sales Performance'
                }
              }
            }} />
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Earnings Overview</h2>
            <Bar data={earningsData} options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: true,
                  text: 'Monthly Earnings'
                }
              }
            }} />
          </div>
        </div>
      </div>
    </div>
  );
} 