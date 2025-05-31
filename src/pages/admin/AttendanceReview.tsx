import React, { useState, useEffect } from 'react';
import { Clock, Search, Download, Edit2, Check, X, Plus, Users } from 'lucide-react';
import { unparse } from 'papaparse';
import { Dialog } from '@headlessui/react';
import { format } from 'date-fns';
import BackButton from '../../components/BackButton';
import { toast } from 'react-toastify';

interface Student {
  id: string;
  name: string;
  registrationNumber: string;
  department: string;
}

interface AttendanceRecord {
  id: number;
  employee: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalHours: string;
  department?: string;
  registrationNumber?: string;
}

const AttendanceReview = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Mock students data - replace with API call
  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'John Doe', registrationNumber: 'STD001', department: 'HNDIT' },
    { id: '2', name: 'Jane Smith', registrationNumber: 'STD002', department: 'HNDA' },
    { id: '3', name: 'Alice Johnson', registrationNumber: 'STD003', department: 'HNDIT' },
    { id: '4', name: 'Bob Wilson', registrationNumber: 'STD004', department: 'HNDE' },
  ]);

  const [editForm, setEditForm] = useState({
    checkIn: '',
    checkOut: '',
    status: '',
    totalHours: '',
  });

  const [bulkAttendanceForm, setBulkAttendanceForm] = useState({
    department: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    checkIn: '',
    checkOut: '',
    status: 'present',
  });

  const [newAttendanceForm, setNewAttendanceForm] = useState({
    employee: '',
    registrationNumber: '',
    department: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    checkIn: '',
    checkOut: '',
    status: 'present',
  });

  // Mock attendance records - replace with API call
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([
    {
      id: 1,
      employee: 'John Doe',
      registrationNumber: 'STD001',
      department: 'HNDIT',
      date: '2024-03-10',
      checkIn: '09:00',
      checkOut: '17:30',
      status: 'Present',
      totalHours: '8.5'
    },
    {
      id: 2,
      employee: 'Jane Smith',
      registrationNumber: 'STD002',
      department: 'HNDA',
      date: '2024-03-10',
      checkIn: '08:45',
      checkOut: '16:45',
      status: 'Present',
      totalHours: '8.0'
    },
  ]);

  const filteredStudents = students.filter(student => {
    if (!bulkAttendanceForm.department) return true;
    return student.department === bulkAttendanceForm.department;
  });

  const handleExportCSV = () => {
    const csvData = attendanceRecords.map(record => ({
      'Student Name': record.employee,
      'Registration Number': record.registrationNumber,
      Department: record.department,
      Date: record.date,
      'Check In': record.checkIn,
      'Check Out': record.checkOut,
      'Total Hours': record.totalHours,
      Status: record.status
    }));

    const csv = unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setEditForm({
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      status: record.status,
      totalHours: record.totalHours,
    });
    setIsEditModalOpen(true);
  };

  const calculateTotalHours = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return '0';
    
    const [inHours, inMinutes] = checkIn.split(':').map(Number);
    const [outHours, outMinutes] = checkOut.split(':').map(Number);
    
    const totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
    return (totalMinutes / 60).toFixed(1);
  };

  const handleSubmitEdit = () => {
    if (!selectedRecord) return;

    const totalHours = calculateTotalHours(editForm.checkIn, editForm.checkOut);

    const updatedRecords = attendanceRecords.map(record =>
      record.id === selectedRecord.id
        ? { ...record, ...editForm, totalHours }
        : record
    );

    setAttendanceRecords(updatedRecords);
    setIsEditModalOpen(false);
    toast.success('Attendance record updated successfully');
  };

  const handleAddAttendance = () => {
    const totalHours = calculateTotalHours(
      newAttendanceForm.checkIn,
      newAttendanceForm.checkOut
    );

    const newRecord: AttendanceRecord = {
      id: Math.max(...attendanceRecords.map(r => r.id)) + 1,
      employee: newAttendanceForm.employee,
      registrationNumber: newAttendanceForm.registrationNumber,
      department: newAttendanceForm.department,
      date: newAttendanceForm.date,
      checkIn: newAttendanceForm.checkIn,
      checkOut: newAttendanceForm.checkOut,
      status: newAttendanceForm.status,
      totalHours,
    };

    setAttendanceRecords([...attendanceRecords, newRecord]);
    setIsAddModalOpen(false);
    toast.success('New attendance record added successfully');

    setNewAttendanceForm({
      employee: '',
      registrationNumber: '',
      department: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      checkIn: '',
      checkOut: '',
      status: 'present',
    });
  };

  const handleBulkAttendance = () => {
    const totalHours = calculateTotalHours(
      bulkAttendanceForm.checkIn,
      bulkAttendanceForm.checkOut
    );

    const newRecords: AttendanceRecord[] = selectedStudents.map((studentId) => {
      const student = students.find(s => s.id === studentId);
      if (!student) return null;

      return {
        id: Math.max(...attendanceRecords.map(r => r.id)) + 1,
        employee: student.name,
        registrationNumber: student.registrationNumber,
        department: student.department,
        date: bulkAttendanceForm.date,
        checkIn: bulkAttendanceForm.checkIn,
        checkOut: bulkAttendanceForm.checkOut,
        status: bulkAttendanceForm.status,
        totalHours,
      };
    }).filter((record): record is AttendanceRecord => record !== null);

    setAttendanceRecords([...attendanceRecords, ...newRecords]);
    setIsBulkAddModalOpen(false);
    toast.success(`Attendance added for ${selectedStudents.length} students`);

    setBulkAttendanceForm({
      department: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      checkIn: '',
      checkOut: '',
      status: 'present',
    });
    setSelectedStudents([]);
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    const departmentStudents = students
      .filter(student => student.department === bulkAttendanceForm.department)
      .map(student => student.id);
    setSelectedStudents(departmentStudents);
  };

  const deselectAllStudents = () => {
    setSelectedStudents([]);
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = 
      record.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !selectedDate || record.date === selectedDate;
    const matchesStatus = !selectedStatus || record.status.toLowerCase() === selectedStatus.toLowerCase();
    const matchesDepartment = !selectedDepartment || record.department === selectedDepartment;
    return matchesSearch && matchesDate && matchesStatus && matchesDepartment;
  });

  return (
    <div className="p-6">
      <div className="mb-4">
        <BackButton />
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Clock className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Attendance Records</h2>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsBulkAddModalOpen(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Users className="w-4 h-4 mr-2" />
                Bulk Add
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Single
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or reg. number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
            
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
            
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
            </select>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Departments</option>
              <option value="HNDIT">HNDIT</option>
              <option value="HNDA">HNDA</option>
              <option value="HNDE">HNDE</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.employee}</div>
                      <div className="text-sm text-gray-500">{record.registrationNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{record.date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{record.checkIn}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{record.checkOut}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{record.totalHours} hrs</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        record.status.toLowerCase() === 'present'
                          ? 'bg-green-100 text-green-800'
                          : record.status.toLowerCase() === 'absent'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Attendance Modal */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-medium mb-4">
              Edit Attendance Record
            </Dialog.Title>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check In Time
                </label>
                <input
                  type="time"
                  value={editForm.checkIn}
                  onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check Out Time
                </label>
                <input
                  type="time"
                  value={editForm.checkOut}
                  onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Add Single Attendance Modal */}
      <Dialog
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-medium mb-4">
              Add New Attendance Record
            </Dialog.Title>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  value={newAttendanceForm.employee}
                  onChange={(e) => setNewAttendanceForm({ ...newAttendanceForm, employee: e.target.value })}
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
                  value={newAttendanceForm.registrationNumber}
                  onChange={(e) => setNewAttendanceForm({ ...newAttendanceForm, registrationNumber: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={newAttendanceForm.department}
                  onChange={(e) => setNewAttendanceForm({ ...newAttendanceForm, department: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select Department</option>
                  <option value="HNDIT">HNDIT</option>
                  <option value="HNDA">HNDA</option>
                  <option value="HNDE">HNDE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newAttendanceForm.date}
                  onChange={(e) => setNewAttendanceForm({ ...newAttendanceForm, date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check In Time
                </label>
                <input
                  type="time"
                  value={newAttendanceForm.checkIn}
                  onChange={(e) => setNewAttendanceForm({ ...newAttendanceForm, checkIn: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check Out Time
                </label>
                <input
                  type="time"
                  value={newAttendanceForm.checkOut}
                  onChange={(e) => setNewAttendanceForm({ ...newAttendanceForm, checkOut: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={newAttendanceForm.status}
                  onChange={(e) => setNewAttendanceForm({ ...newAttendanceForm, status: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAttendance}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Record
                </button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Bulk Add Attendance Modal */}
      <Dialog
        open={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-4xl w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-medium mb-4">
              Bulk Add Attendance
            </Dialog.Title>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={bulkAttendanceForm.department}
                    onChange={(e) => {
                      setBulkAttendanceForm({ ...bulkAttendanceForm, department: e.target.value });
                      setSelectedStudents([]);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="HNDIT">HNDIT</option>
                    <option value="HNDA">HNDA</option>
                    <option value="HNDE">HNDE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={bulkAttendanceForm.date}
                    onChange={(e) => setBulkAttendanceForm({ ...bulkAttendanceForm, date: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check In Time
                  </label>
                  <input
                    type="time"
                    value={bulkAttendanceForm.checkIn}
                    onChange={(e) => setBulkAttendanceForm({ ...bulkAttendanceForm, checkIn: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check Out Time
                  </label>
                  <input
                    type="time"
                    value={bulkAttendanceForm.checkOut}
                    onChange={(e) => setBulkAttendanceForm({ ...bulkAttendanceForm, checkOut: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={bulkAttendanceForm.status}
                    onChange={(e) => setBulkAttendanceForm({ ...bulkAttendanceForm, status: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                  </select>
                </div>
              </div>

              {bulkAttendanceForm.department && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Select Students</h3>
                    <div className="space-x-2">
                      <button
                        type="button"
                        onClick={selectAllStudents}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={deselectAllStudents}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredStudents.map(student => (
                      <div
                        key={student.id}
                        className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.registrationNumber}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setIsBulkAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAttendance}
                  disabled={selectedStudents.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AttendanceReview;