import React, { useState, useEffect, useCallback } from 'react';
import { Users, Edit2, Trash2, Search, Upload, X } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import BackButton from '../../components/BackButton';

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  year: string;
  registrationNumber: string;
  birthDate: string;
  profilePicture?: string;
}

const ManageUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState({
    department: '',
    year: '',
    search: ''
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    registrationNumber: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
    profilePicture: null as File | null
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Mock data
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      department: 'HNDIT',
      year: '1st Year',
      registrationNumber: 'IT2023001',
      birthDate: '2000-01-01',
      profilePicture: 'https://example.com/profile1.jpg'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      department: 'HNDA',
      year: '2nd Year',
      registrationNumber: 'DA2022002',
      birthDate: '1999-05-15',
      profilePicture: 'https://example.com/profile2.jpg'
    }
  ];

  useEffect(() => {
    // In a real application, this would be an API call
    setUsers(mockUsers);
  }, []);

  useEffect(() => {
    let result = [...users];

    if (filters.department) {
      result = result.filter(user => user.department === filters.department);
    }
    if (filters.year) {
      result = result.filter(user => user.year === filters.year);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    setFilteredUsers(result);
  }, [users, filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedUser) {
      // In a real application, this would be an API call
      setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      registrationNumber: user.registrationNumber,
      birthDate: user.birthDate,
      password: '',
      confirmPassword: '',
      profilePicture: null
    });
    setPreviewUrl(user.profilePicture || null);
    setIsEditModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditForm(prev => ({ ...prev, profilePicture: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePicture = () => {
    setPreviewUrl(null);
    setEditForm(prev => ({ ...prev, profilePicture: null }));
    // In a real application, make an API call to remove the profile picture
    if (selectedUser) {
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id 
          ? { ...user, profilePicture: null }
          : user
      ));
    }
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editForm.password !== editForm.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    // In a real application, this would be an API call
    setUsers(prev => prev.map(user => 
      user.id === selectedUser?.id
        ? {
            ...user,
            name: editForm.name,
            email: editForm.email,
            registrationNumber: editForm.registrationNumber,
            birthDate: editForm.birthDate,
            profilePicture: previewUrl
          }
        : user
    ));

    setIsEditModalOpen(false);
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <BackButton />
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Users className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Manage Students</h2>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <input
                type="text"
                name="search"
                placeholder="Search students..."
                value={filters.search}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
            
            <select
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Departments</option>
              <option value="HNDIT">HNDIT</option>
              <option value="HNDM">HNDM</option>
              <option value="HNDA">HNDA</option>
              <option value="HNDE">HNDE</option>
            </select>

            <select
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                            alt={user.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.year}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.registrationNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(user)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-medium mb-4">
              Edit Student Information
            </Dialog.Title>

            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden">
                    {previewUrl ? (
                      <>
                        <img 
                          src={previewUrl} 
                          alt="Profile preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveProfilePicture}
                          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                    <Upload size={16} />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number
                </label>
                <input
                  type="text"
                  value={editForm.registrationNumber}
                  onChange={(e) => setEditForm(prev => ({ ...prev, registrationNumber: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Birth Date
                </label>
                <input
                  type="date"
                  value={editForm.birthDate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, birthDate: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={editForm.confirmPassword}
                  onChange={(e) => setEditForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Confirm Delete
            </Dialog.Title>

            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ManageUsers;