import axios from 'axios';
import { User, DashboardStats, ActivityItem, LeaveRequest, ApiResponse } from '../types';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const mockUsers = {
  admin: {
    id: 'ADMIN001',
    adminId: 'ADM001',
    name: 'Admin User',
    email: 'admin@mlvisiotrack.com',
    password: 'admin123',
    role: 'admin',
    department: 'Administration',
    profilePicture: null,
    joinDate: '2024-01-01'
  },
  admin2: {
    id: 'ADMIN002',
    adminId: 'ADM002',
    name: 'Second Admin',
    email: 'admin2@mlvisiotrack.com',
    password: 'admin456',
    role: 'admin',
    department: 'Administration',
    profilePicture: null,
    joinDate: '2024-01-15'
  },
  user: {
    id: 'STD001',
    name: 'Regular User',
    email: 'user@mlvisiotrack.com',
    password: 'user123',
    role: 'user',
    department: 'Engineering',
    profilePicture: null,
    joinDate: '2024-02-01'
  }
};

const mockUserActivities = {
  'ADMIN001': [
    {
      id: '1',
      type: 'check-in',
      timestamp: new Date().toISOString(),
      details: 'Admin User checked in for the day'
    },
    {
      id: '2',
      type: 'leave-approved',
      timestamp: new Date().toISOString(),
      details: 'Admin User approved a leave request'
    }
  ],
  'ADMIN002': [
    {
      id: '5',
      type: 'check-in',
      timestamp: new Date().toISOString(),
      details: 'Second Admin checked in for the day'
    }
  ],
  'STD001': [
    {
      id: '3',
      type: 'check-in',
      timestamp: new Date().toISOString(),
      details: 'Regular User checked in for the day'
    },
    {
      id: '4',
      type: 'leave-request',
      timestamp: new Date().toISOString(),
      details: 'Regular User requested vacation leave'
    }
  ]
};

const mockLeaveRequests: LeaveRequest[] = [
  {
    id: '1',
    type: 'vacation',
    startDate: '2024-03-15',
    endDate: '2024-03-20',
    reason: 'Annual family vacation',
    status: 'pending',
    createdAt: '2024-03-10T10:00:00Z'
  },
  {
    id: '2',
    type: 'sick',
    startDate: '2024-03-12',
    endDate: '2024-03-13',
    reason: 'Not feeling well',
    status: 'pending',
    createdAt: '2024-03-11T09:00:00Z'
  }
];

export const login = async (email: string, password: string, adminId?: string): Promise<ApiResponse<{ user: User; token: string }>> => {
  const adminUsers = [mockUsers.admin, mockUsers.admin2];
  const regularUser = mockUsers.user;

  let authenticatedUser = null;

  if (adminId) {
    // Admin login
    const adminUser = adminUsers.find(admin => 
      admin.email === email && 
      admin.password === password && 
      admin.adminId === adminId
    );
    
    if (adminUser) {
      authenticatedUser = { ...adminUser };
      delete authenticatedUser.password;
    }
  } else {
    // Regular user login
    if (email === regularUser.email && password === regularUser.password) {
      authenticatedUser = { ...regularUser };
      delete authenticatedUser.password;
    }
  }

  if (authenticatedUser) {
    const mockToken = 'mock-jwt-token';
    localStorage.setItem('role', authenticatedUser.role);
    return {
      success: true,
      data: {
        user: authenticatedUser,
        token: mockToken
      }
    };
  }

  return {
    success: false,
    data: null,
    message: adminId ? 'Invalid admin credentials' : 'Invalid email or password'
  };
};

export const logout = async (): Promise<void> => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
};

const mockDashboardStats: DashboardStats = {
  present: 45,
  absent: 5,
  leave: 3,
  totalHours: 360
};

export const getRecentActivity = async (): Promise<ApiResponse<ActivityItem[]>> => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userActivities = mockUserActivities[currentUser.id as keyof typeof mockUserActivities] || [];
  
  return {
    success: true,
    data: userActivities
  };
};

export const getDashboardStats = async (): Promise<ApiResponse<DashboardStats>> => {
  return {
    success: true,
    data: mockDashboardStats
  };
};

export const getLeaveRequests = async (): Promise<ApiResponse<LeaveRequest[]>> => {
  return {
    success: true,
    data: mockLeaveRequests
  };
};

export const submitLeaveRequest = async (leaveData: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>): Promise<ApiResponse<LeaveRequest>> => {
  const mockLeaveRequest: LeaveRequest = {
    id: Math.random().toString(),
    ...leaveData,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  mockLeaveRequests.push(mockLeaveRequest);

  return {
    success: true,
    data: mockLeaveRequest
  };
};

export const getUserProfile = async (): Promise<ApiResponse<User>> => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  return {
    success: true,
    data: currentUser
  };
};

export const updateUserProfile = async (profileData: Partial<User>): Promise<ApiResponse<User>> => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const updatedUser = { ...currentUser, ...profileData };
  
  return {
    success: true,
    data: updatedUser
  };
};

export const uploadProfilePicture = async (file: File): Promise<ApiResponse<{ url: string }>> => {
  try {
    const storage = getStorage();
    const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
    const storageRef = ref(storage, `profile-pictures/${userId}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return {
      success: true,
      data: { url: downloadURL }
    };
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return {
      success: false,
      data: null,
      message: 'Failed to upload profile picture'
    };
  }
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userType = currentUser.role === 'admin' ? 'admin' : 'user';
  
  if (currentPassword !== mockUsers[userType as keyof typeof mockUsers].password) {
    return {
      success: false,
      data: null,
      message: 'Current password is incorrect'
    };
  }

  mockUsers[userType as keyof typeof mockUsers].password = newPassword;

  return {
    success: true,
    data: null,
    message: 'Password changed successfully'
  };
};

export default api;