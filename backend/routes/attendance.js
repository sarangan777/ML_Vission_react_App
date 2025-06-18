const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');

const router = express.Router();

// Record attendance (for ESP32-CAM devices or manual entry)
router.post('/record', auth, [
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('status').isIn(['Present', 'Absent', 'Late', 'Excused']).withMessage('Invalid status'),
  body('courseId').optional().notEmpty(),
  body('scheduleId').optional().notEmpty(),
  body('arrivalTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const attendanceData = {
      ...req.body,
      recordedBy: req.user.userId,
      method: req.body.method || 'manual'
    };

    const result = await Attendance.recordAttendance(attendanceData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Attendance recorded successfully'
    });

  } catch (error) {
    console.error('Attendance recording error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Bulk record attendance
router.post('/bulk-record', auth, [
  body('attendanceRecords').isArray().withMessage('Attendance records must be an array'),
  body('attendanceRecords.*.studentId').notEmpty().withMessage('Student ID is required'),
  body('attendanceRecords.*.date').isISO8601().withMessage('Valid date is required'),
  body('attendanceRecords.*.status').isIn(['Present', 'Absent', 'Late', 'Excused']).withMessage('Invalid status')
], async (req, res) => {
  try {
    // Only admins can bulk record attendance
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { attendanceRecords } = req.body;
    
    // Add metadata to each record
    const recordsWithMetadata = attendanceRecords.map(record => ({
      ...record,
      recordedBy: req.user.userId,
      method: 'bulk_manual'
    }));

    const results = await Attendance.bulkRecordAttendance(recordsWithMetadata);

    res.status(201).json({
      success: true,
      data: results,
      message: `${results.length} attendance records created successfully`
    });

  } catch (error) {
    console.error('Bulk attendance recording error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Get attendance records for a student
router.get('/student/:studentId', auth, [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // Students can only view their own attendance, admins can view any
    if (req.user.role !== 'admin' && req.user.userId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own attendance.'
      });
    }

    const attendanceRecords = await Attendance.getAttendanceByStudent(studentId, startDate, endDate);

    res.json({
      success: true,
      data: attendanceRecords
    });

  } catch (error) {
    console.error('Attendance fetch error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Get attendance by date (admin only)
router.get('/date/:date', auth, [
  query('department').optional().notEmpty(),
  query('course').optional().notEmpty()
], async (req, res) => {
  try {
    // Only admins can view attendance by date
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { date } = req.params;
    const filters = {
      department: req.query.department,
      course: req.query.course
    };

    const attendanceRecords = await Attendance.getAttendanceByDate(date, filters);

    res.json({
      success: true,
      data: attendanceRecords
    });

  } catch (error) {
    console.error('Attendance fetch error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Get attendance statistics
router.get('/stats/:studentId', auth, [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // Students can only view their own stats, admins can view any
    if (req.user.role !== 'admin' && req.user.userId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own statistics.'
      });
    }

    const stats = await Attendance.getAttendanceStats(studentId, startDate, endDate);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Update attendance status (admin only)
router.put('/:attendanceId', auth, [
  body('status').isIn(['Present', 'Absent', 'Late', 'Excused']).withMessage('Invalid status'),
  body('remarks').optional().isString()
], async (req, res) => {
  try {
    // Only admins can update attendance
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { attendanceId } = req.params;
    const { status, remarks } = req.body;

    await Attendance.updateAttendanceStatus(attendanceId, status, remarks);

    res.json({
      success: true,
      message: 'Attendance status updated successfully'
    });

  } catch (error) {
    console.error('Attendance update error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

module.exports = router;