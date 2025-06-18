const { db } = require('../config/firebase');

class Attendance {
  static async recordAttendance(attendanceData) {
    try {
      const docRef = await db.collection('attendance').add({
        ...attendanceData,
        timestamp: new Date(),
        createdAt: new Date()
      });
      
      return { id: docRef.id, ...attendanceData };
    } catch (error) {
      throw new Error(`Firestore error: ${error.message}`);
    }
  }

  static async getAttendanceByStudent(studentId, startDate, endDate) {
    try {
      let query = db.collection('attendance').where('studentId', '==', studentId);
      
      if (startDate) {
        query = query.where('date', '>=', startDate);
      }
      
      if (endDate) {
        query = query.where('date', '<=', endDate);
      }
      
      const snapshot = await query.orderBy('date', 'desc').get();
      
      const attendanceRecords = [];
      snapshot.forEach(doc => {
        attendanceRecords.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return attendanceRecords;
    } catch (error) {
      throw new Error(`Firestore error: ${error.message}`);
    }
  }

  static async getAttendanceByDate(date, filters = {}) {
    try {
      let query = db.collection('attendance').where('date', '==', date);
      
      if (filters.department) {
        query = query.where('department', '==', filters.department);
      }
      
      if (filters.course) {
        query = query.where('courseId', '==', filters.course);
      }
      
      const snapshot = await query.get();
      
      const attendanceRecords = [];
      snapshot.forEach(doc => {
        attendanceRecords.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return attendanceRecords;
    } catch (error) {
      throw new Error(`Firestore error: ${error.message}`);
    }
  }

  static async updateAttendanceStatus(attendanceId, newStatus, remarks = '') {
    try {
      await db.collection('attendance').doc(attendanceId).update({
        status: newStatus,
        remarks: remarks,
        updatedAt: new Date()
      });
      
      return true;
    } catch (error) {
      throw new Error(`Firestore error: ${error.message}`);
    }
  }

  static async getAttendanceStats(studentId, startDate, endDate) {
    try {
      const attendanceRecords = await this.getAttendanceByStudent(studentId, startDate, endDate);
      
      const stats = {
        total: attendanceRecords.length,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0
      };
      
      attendanceRecords.forEach(record => {
        switch (record.status?.toLowerCase()) {
          case 'present':
            stats.present++;
            break;
          case 'absent':
            stats.absent++;
            break;
          case 'late':
            stats.late++;
            break;
          case 'excused':
            stats.excused++;
            break;
        }
      });
      
      stats.attendancePercentage = stats.total > 0 
        ? Math.round(((stats.present + stats.late + stats.excused) / stats.total) * 100)
        : 0;
      
      return stats;
    } catch (error) {
      throw new Error(`Firestore error: ${error.message}`);
    }
  }

  static async bulkRecordAttendance(attendanceRecords) {
    try {
      const batch = db.batch();
      const results = [];
      
      attendanceRecords.forEach(record => {
        const docRef = db.collection('attendance').doc();
        batch.set(docRef, {
          ...record,
          timestamp: new Date(),
          createdAt: new Date()
        });
        results.push({ id: docRef.id, ...record });
      });
      
      await batch.commit();
      return results;
    } catch (error) {
      throw new Error(`Firestore error: ${error.message}`);
    }
  }
}

module.exports = Attendance;