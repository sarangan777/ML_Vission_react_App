import React, { useState, useEffect } from 'react';
import { Download, Filter, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Papa from 'papaparse';
import BackButton from '../components/BackButton';
import AttendanceReviewModal from '../components/AttendanceReviewModal';
import { toast, ToastContainer } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import * as apiService from '../services/api';

interface AttendanceRecord {
  id: number;
  studentId: string;
  deviceId: string;
  timestamp: string;
  studentName?: string;
  registrationNumber?: string;
  department?: string;
  status: string;
  reviewed?: boolean;
}

const AttendanceReport: React.FC = () => {
  const [selectedDateRange, setSelectedDateRange] = useState<string>('current');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDateRange]);

  const fetchAttendanceData = async () => {
    try {
      setIsLoading(true);
      
      let startDate, endDate;
      const now = new Date();
      
      if (selectedDateRange === 'current') {
        startDate = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
        endDate = format(now, 'yyyy-MM-dd');
      } else if (selectedDateRange === 'previous') {
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate = format(prevMonth, 'yyyy-MM-dd');
        endDate = format(new Date(now.getFullYear(), now.getMonth(), 0), 'yyyy-MM-dd');
      }
      
      const response = user?.role === 'admin' 
        ? await apiService.getAttendanceRecords(startDate, endDate)
        : await apiService.getStudentAttendance(user?.id || '', startDate, endDate);
      
      if (response.success && response.data) {
        setAttendanceRecords(response.data);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const element = document.getElementById('attendance-table');
      if (!element) return;

      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('attendance-report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    try {
      setIsExporting(true);
      const csvData = filteredRecords.map(record => ({
        'Student ID': record.studentId,
        'Student Name': record.studentName || 'N/A',
        'Registration Number': record.registrationNumber || 'N/A',
        'Department': record.department || 'N/A',
        'Device ID': record.deviceId,
        'Timestamp': format(new Date(record.timestamp), 'MMM dd, yyyy HH:mm:ss'),
        'Status': record.status || 'Present'
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating CSV:', error);
      toast.error('Failed to generate CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleReviewRequest = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setIsReviewModalOpen(true);
  };

  const filteredRecords = attendanceRecords.filter(record => {
    if (selectedStatus === 'all') return true;
    return (record.status || 'Present').toLowerCase() === selectedStatus.toLowerCase();
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7494ec]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-4">
        <BackButton />
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Attendance Report</h2>
          <div className="flex space-x-3">
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="current">Current Month</option>
              <option value="previous">Previous Month</option>
              <option value="custom">Custom Range</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
            </select>
            <div className="flex space-x-2">
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="px-4 py-2 bg-[#7494ec] text-white rounded-lg hover:bg-[#5b7cde] text-sm flex items-center disabled:opacity-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </button>
              <button
                onClick={handleExportCSV}
                disabled={isExporting}
                className="px-4 py-2 border border-[#7494ec] text-[#7494ec] rounded-lg hover:bg-gray-50 text-sm flex items-center disabled:opacity-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto" id="attendance-table">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {user?.role === 'user' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {record.studentName || record.studentId}
                    </div>
                    {record.registrationNumber && (
                      <div className="text-sm text-gray-500">{record.registrationNumber}</div>
                    )}
                    {record.department && (
                      <div className="text-xs text-gray-400">{record.department}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.deviceId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(record.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {record.status || 'Present'}
                    </span>
                  </td>
                  {user?.role === 'user' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!record.reviewed && (
                        <button
                          onClick={() => handleReviewRequest(record)}
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Request Review
                        </button>
                      )}
                      {record.reviewed && (
                        <span className="text-gray-500 italic">Review requested</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No attendance records found for the selected criteria.
            </div>
          )}
        </div>
      </div>

      {selectedRecord && (
        <AttendanceReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedRecord(null);
          }}
          date={format(new Date(selectedRecord.timestamp), 'yyyy-MM-dd')}
          status={selectedRecord.status || 'Present'}
          studentId={user?.id || ''}
        />
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AttendanceReport;