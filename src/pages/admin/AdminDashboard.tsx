import React, { useState, useEffect } from 'react';
import { Calendar, Users, FileText, Clock } from 'lucide-react';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import StatCard from '../../components/StatCard';
import * as apiService from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    attendanceRate: 0,
    totalCourses: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const statsResponse = await apiService.getDashboardStats();

      if (statsResponse.success) {
        setStats({
          totalStudents: 450,
          presentToday: 425,
          attendanceRate: 94,
          totalCourses: 24
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const departmentData = {
    labels: ['HNDIT', 'HNDA', 'HNDE', 'HNDM'],
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: [95, 92, 88, 90],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const courseData = {
    labels: ['Full Time', 'Part Time'],
    datasets: [
      {
        data: [16, 8],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)'
        ]
      }
    ]
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          bgColor="bg-white"
          textColor="text-gray-800"
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          icon={<Clock className="w-6 h-6 text-green-600" />}
          bgColor="bg-white"
          textColor="text-gray-800"
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats.attendanceRate}%`}
          icon={<FileText className="w-6 h-6 text-purple-600" />}
          bgColor="bg-white"
          textColor="text-gray-800"
        />
        <StatCard
          title="Total Courses"
          value={stats.totalCourses}
          icon={<Calendar className="w-6 h-6 text-orange-600" />}
          bgColor="bg-white"
          textColor="text-gray-800"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Attendance by Department</h2>
          <div className="h-[300px]">
            <Line data={departmentData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Course Distribution</h2>
          <div className="h-[300px]">
            <Pie data={courseData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Today's Schedule Overview</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lecturer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">09:00 - 11:00</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">HNDIT</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Mr. Rajkumar</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Lab 01</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    In Progress
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">11:00 - 13:00</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">HNDA</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Mrs. Priya</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Lab 02</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Upcoming
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;