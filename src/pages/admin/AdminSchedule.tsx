import React, { useState } from 'react';
import { Calendar, Download, Plus, Edit2, Trash2 } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { format, parseISO } from 'date-fns';
import BackButton from '../../components/BackButton';
import { sendScheduleNotification } from '../../services/notification';
import { toast } from 'react-toastify';

interface Schedule {
  id: string;
  course: string;
  lecturer: string;
  startTime: string;
  endTime: string;
  day: string;
  room: string;
  date: string;
}

const AdminSchedule = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const courses = [
    'Advanced Java',
    'Web Development',
    'Database Management',
    'Software Engineering',
    'Network Security',
    'Mobile Development'
  ];

  const handleAddSchedule = async (schedule: Omit<Schedule, 'id'>) => {
    try {
      const newSchedule = {
        ...schedule,
        id: Math.random().toString(36).substr(2, 9)
      };
      
      setSchedules([...schedules, newSchedule]);
      
      // Send notification to students in the relevant department
      await sendScheduleNotification(newSchedule, newSchedule.course);
      toast.success('Schedule added and notifications sent successfully');
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast.error('Failed to add schedule or send notifications');
    }
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setSchedules(schedules.map(s => s.id === schedule.id ? schedule : s));
    setEditingSchedule(null);
    setIsModalOpen(false);
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  const exportSchedule = () => {
    const csv = [
      ['Course', 'Lecturer', 'Day', 'Date', 'Start Time', 'End Time', 'Room'],
      ...schedules.map(s => [s.course, s.lecturer, s.day, s.date, s.startTime, s.endTime, s.room])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schedule.csv';
    a.click();
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <BackButton />
      </div>
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Calendar className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Course Schedule</h2>
            </div>
            <div className="flex space-x-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Schedule
              </button>
              <button
                onClick={exportSchedule}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-20 p-3 border bg-gray-50"></th>
                  {weekDays.map(day => (
                    <th key={day} className="p-3 border bg-gray-50 font-medium text-gray-700">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(time => (
                  <tr key={time}>
                    <td className="p-3 border text-sm text-gray-500 font-medium">
                      {time}
                    </td>
                    {weekDays.map(day => {
                      const schedule = schedules.find(
                        s => s.day === day && s.startTime <= time && s.endTime > time && s.date === selectedDate
                      );
                      
                      return (
                        <td key={`${day}-${time}`} className="p-3 border relative">
                          {schedule && (
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <div className="font-medium text-sm">{schedule.course}</div>
                              <div className="text-xs text-gray-600">{schedule.lecturer}</div>
                              <div className="text-xs text-gray-600">Room: {schedule.room}</div>
                              <div className="absolute top-2 right-2 flex space-x-1">
                                <button
                                  onClick={() => setEditingSchedule(schedule)}
                                  className="p-1 hover:bg-blue-200 rounded"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSchedule(schedule.id)}
                                  className="p-1 hover:bg-red-100 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog
        open={isModalOpen || !!editingSchedule}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSchedule(null);
        }}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-medium mb-4">
              {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
            </Dialog.Title>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const scheduleData = {
                course: formData.get('course') as string,
                lecturer: formData.get('lecturer') as string,
                day: formData.get('day') as string,
                startTime: formData.get('startTime') as string,
                endTime: formData.get('endTime') as string,
                room: formData.get('room') as string,
                date: formData.get('date') as string,
              };

              if (editingSchedule) {
                handleEditSchedule({ ...scheduleData, id: editingSchedule.id });
              } else {
                handleAddSchedule(scheduleData);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={editingSchedule?.date || selectedDate}
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course
                  </label>
                  <select
                    name="course"
                    defaultValue={editingSchedule?.course}
                    className="w-full p-2 border rounded-lg"
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lecturer
                  </label>
                  <input
                    type="text"
                    name="lecturer"
                    defaultValue={editingSchedule?.lecturer}
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day
                  </label>
                  <select
                    name="day"
                    defaultValue={editingSchedule?.day}
                    className="w-full p-2 border rounded-lg"
                    required
                  >
                    <option value="">Select Day</option>
                    {weekDays.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      defaultValue={editingSchedule?.startTime}
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      defaultValue={editingSchedule?.endTime}
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room
                  </label>
                  <input
                    type="text"
                    name="room"
                    defaultValue={editingSchedule?.room}
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSchedule(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSchedule ? 'Save Changes' : 'Add Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminSchedule;