import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Search, X } from 'lucide-react';
import { format } from 'date-fns';

interface Student {
  id: string;
  name: string;
  registrationNumber: string;
  department: string;
  type: 'Full Time' | 'Part Time';
  year: '1st Year' | '2nd Year' | '3rd Year';
}

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (attendanceData: any) => void;
}

const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [department, setDepartment] = useState('');
  const [type, setType] = useState('');
  const [year, setYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);

  // Mock data - replace with API call
  const mockStudents: Student[] = [
    {
      id: '1',
      name: 'John Doe',
      registrationNumber: 'HNDIT/FT/2023/001',
      department: 'HNDIT',
      type: 'Full Time',
      year: '1st Year'
    },
    {
      id: '2',
      name: 'Jane Smith',
      registrationNumber: 'HNDA/PT/2023/001',
      department: 'HNDA',
      type: 'Part Time',
      year: '2nd Year'
    },
    // Add more mock students...
  ];

  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      setStudents(mockStudents);
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredStudents = students.filter(student => {
    const matchesDepartment = !department || student.department === department;
    const matchesType = !type || student.type === type;
    const matchesYear = !year || student.year === year;
    const matchesSearch = !searchTerm || 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesDepartment && matchesType && matchesYear && matchesSearch;
  });

  const handleSelectAll = () => {
    const filteredIds = filteredStudents.map(student => student.id);
    setSelectedStudents(filteredIds);
  };

  const handleDeselectAll = () => {
    setSelectedStudents([]);
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSubmit = () => {
    const attendanceData = {
      date: format(new Date(), 'yyyy-MM-dd'),
      students: selectedStudents.map(id => {
        const student = students.find(s => s.id === id);
        return {
          id,
          name: student?.name,
          registrationNumber: student?.registrationNumber,
          department: student?.department,
          status: 'Present'
        };
      })
    };

    onSubmit(attendanceData);
    handleClose();
  };

  const handleClose = () => {
    setDepartment('');
    setType('');
    setYear('');
    setSearchTerm('');
    setSelectedStudents([]);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded-lg w-full max-w-4xl p-6">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Add Attendance Manually
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select Department</option>
              <option value="HNDIT">HNDIT</option>
              <option value="HNDA">HNDA</option>
              <option value="HNDM">HNDM</option>
              <option value="HNDE">HNDE</option>
            </select>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select Type</option>
              <option value="Full Time">Full Time</option>
              <option value="Part Time">Part Time</option>
            </select>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select Year</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
            </select>
          </div>

          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or registration number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-60">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-500">
                  {filteredStudents.length} students found
                </p>
                <div className="space-x-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg mb-6">
                {filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No students found matching the criteria
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedStudents.length === filteredStudents.length}
                            onChange={handleSelectAll}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registration No.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Year
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudents.map(student => (
                        <tr
                          key={student.id}
                          onClick={() => toggleStudent(student.id)}
                          className="hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => toggleStudent(student.id)}
                              onClick={e => e.stopPropagation()}
                              className="h-4 w-4 text-blue-600 rounded border-gray-300"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {student.registrationNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {student.type}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {student.year}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={selectedStudents.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Mark Attendance
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default ManualAttendanceModal;