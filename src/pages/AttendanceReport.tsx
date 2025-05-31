import React, { useState, useRef } from 'react';
import { Download, Filter, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Papa from 'papaparse';
import BackButton from '../components/BackButton';
import AttendanceReviewModal from '../components/AttendanceReviewModal';
import { toast, ToastContainer } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  arrivalTime: string;
  reviewed?: boolean;
}

const AttendanceReport: React.FC = () => {
  const [selectedDateRange, setSelectedDateRange] = useState<string>('current');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const { user } = useAuth();

  // Mock attendance records
  const mockAttendance: AttendanceRecord[] = [
    {
      id: '1',
      date: '2024-03-11',
      status: 'Present',
      arrivalTime: '08:55',
    },
    {
      id: '2',
      date: '2024-03-12',
      status: 'Absent',
      arrivalTime: '-',
    },
    {
      id: '3',
      date: '2024-03-13',
      status: 'Late',
      arrivalTime: '09:15',
      reviewed: true,
    }
  ];

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
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    try {
      setIsExporting(true);
      const csvData = mockAttendance.map(record => ({
        Date: format(new Date(record.date), 'MMM dd, yyyy'),
        Status: record.status,
        'Arrival Time': record.arrivalTime
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
    } finally {
      setIsExporting(false);
    }
  };

  const handleReviewRequest = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setIsReviewModalOpen(true);
  };

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
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Arrival Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockAttendance.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(record.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      record.status === 'Present'
                        ? 'bg-green-100 text-green-800'
                        : record.status === 'Absent'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.arrivalTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {(record.status === 'Absent' || record.status === 'Late') && !record.reviewed && (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRecord && (
        <AttendanceReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedRecord(null);
          }}
          date={selectedRecord.date}
          status={selectedRecord.status}
          studentId={user?.id || ''}
        />
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AttendanceReport;