package com.mlvisiotrack.dao;

import com.google.cloud.firestore.*;
import com.mlvisiotrack.config.FirebaseConfig;
import com.mlvisiotrack.models.AttendanceRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.ExecutionException;

public class AttendanceDAO {
    private static final Logger logger = LoggerFactory.getLogger(AttendanceDAO.class);
    private static final String COLLECTION_NAME = "attendance";
    
    public AttendanceRecord create(AttendanceRecord record) throws ExecutionException, InterruptedException {
        Firestore db = FirebaseConfig.getFirestore();
        
        Map<String, Object> data = new HashMap<>();
        data.put("studentId", record.getStudentId());
        data.put("studentName", record.getStudentName());
        data.put("registrationNumber", record.getRegistrationNumber());
        data.put("courseId", record.getCourseId());
        data.put("courseName", record.getCourseName());
        data.put("scheduleId", record.getScheduleId());
        data.put("date", record.getDate().toString());
        data.put("arrivalTime", record.getArrivalTime() != null ? record.getArrivalTime().toString() : null);
        data.put("status", record.getStatus().getValue());
        data.put("method", record.getMethod());
        data.put("remarks", record.getRemarks());
        data.put("recordedBy", record.getRecordedBy());
        data.put("timestamp", new Date());
        data.put("createdAt", new Date());
        
        DocumentReference docRef = db.collection(COLLECTION_NAME).document();
        docRef.set(data).get();
        
        record.setId(docRef.getId());
        return record;
    }
    
    public List<AttendanceRecord> bulkCreate(List<AttendanceRecord> records) throws ExecutionException, InterruptedException {
        Firestore db = FirebaseConfig.getFirestore();
        WriteBatch batch = db.batch();
        List<AttendanceRecord> results = new ArrayList<>();
        
        for (AttendanceRecord record : records) {
            DocumentReference docRef = db.collection(COLLECTION_NAME).document();
            
            Map<String, Object> data = new HashMap<>();
            data.put("studentId", record.getStudentId());
            data.put("studentName", record.getStudentName());
            data.put("registrationNumber", record.getRegistrationNumber());
            data.put("courseId", record.getCourseId());
            data.put("courseName", record.getCourseName());
            data.put("scheduleId", record.getScheduleId());
            data.put("date", record.getDate().toString());
            data.put("arrivalTime", record.getArrivalTime() != null ? record.getArrivalTime().toString() : null);
            data.put("status", record.getStatus().getValue());
            data.put("method", record.getMethod());
            data.put("remarks", record.getRemarks());
            data.put("recordedBy", record.getRecordedBy());
            data.put("timestamp", new Date());
            data.put("createdAt", new Date());
            
            batch.set(docRef, data);
            
            record.setId(docRef.getId());
            results.add(record);
        }
        
        batch.commit().get();
        return results;
    }
    
    public List<AttendanceRecord> findByStudent(String studentId, LocalDate startDate, LocalDate endDate) 
            throws ExecutionException, InterruptedException {
        Firestore db = FirebaseConfig.getFirestore();
        Query query = db.collection(COLLECTION_NAME).whereEqualTo("studentId", studentId);
        
        if (startDate != null) {
            query = query.whereGreaterThanOrEqualTo("date", startDate.toString());
        }
        
        if (endDate != null) {
            query = query.whereLessThanOrEqualTo("date", endDate.toString());
        }
        
        query = query.orderBy("date", Query.Direction.DESCENDING);
        
        QuerySnapshot querySnapshot = query.get().get();
        List<AttendanceRecord> records = new ArrayList<>();
        
        for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
            AttendanceRecord record = mapDocumentToRecord(document);
            records.add(record);
        }
        
        return records;
    }
    
    public List<AttendanceRecord> findByDate(LocalDate date, String department, String courseId) 
            throws ExecutionException, InterruptedException {
        Firestore db = FirebaseConfig.getFirestore();
        Query query = db.collection(COLLECTION_NAME).whereEqualTo("date", date.toString());
        
        if (department != null && !department.isEmpty()) {
            query = query.whereEqualTo("department", department);
        }
        
        if (courseId != null && !courseId.isEmpty()) {
            query = query.whereEqualTo("courseId", courseId);
        }
        
        QuerySnapshot querySnapshot = query.get().get();
        List<AttendanceRecord> records = new ArrayList<>();
        
        for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
            AttendanceRecord record = mapDocumentToRecord(document);
            records.add(record);
        }
        
        return records;
    }
    
    public boolean updateStatus(String attendanceId, AttendanceRecord.AttendanceStatus status, String remarks) 
            throws ExecutionException, InterruptedException {
        Firestore db = FirebaseConfig.getFirestore();
        DocumentReference docRef = db.collection(COLLECTION_NAME).document(attendanceId);
        
        Map<String, Object> updates = new HashMap<>();
        updates.put("status", status.getValue());
        updates.put("remarks", remarks);
        updates.put("updatedAt", new Date());
        
        docRef.update(updates).get();
        return true;
    }
    
    public Map<String, Object> getAttendanceStats(String studentId, LocalDate startDate, LocalDate endDate) 
            throws ExecutionException, InterruptedException {
        List<AttendanceRecord> records = findByStudent(studentId, startDate, endDate);
        
        Map<String, Object> stats = new HashMap<>();
        int total = records.size();
        int present = 0;
        int absent = 0;
        int late = 0;
        int excused = 0;
        
        for (AttendanceRecord record : records) {
            switch (record.getStatus()) {
                case PRESENT:
                    present++;
                    break;
                case ABSENT:
                    absent++;
                    break;
                case LATE:
                    late++;
                    break;
                case EXCUSED:
                    excused++;
                    break;
            }
        }
        
        stats.put("total", total);
        stats.put("present", present);
        stats.put("absent", absent);
        stats.put("late", late);
        stats.put("excused", excused);
        
        double attendancePercentage = total > 0 
            ? Math.round(((double)(present + late + excused) / total) * 100.0 * 100.0) / 100.0
            : 0.0;
        
        stats.put("attendancePercentage", attendancePercentage);
        
        return stats;
    }
    
    private AttendanceRecord mapDocumentToRecord(QueryDocumentSnapshot document) {
        AttendanceRecord record = new AttendanceRecord();
        record.setId(document.getId());
        record.setStudentId(document.getString("studentId"));
        record.setStudentName(document.getString("studentName"));
        record.setRegistrationNumber(document.getString("registrationNumber"));
        record.setCourseId(document.getString("courseId"));
        record.setCourseName(document.getString("courseName"));
        record.setScheduleId(document.getString("scheduleId"));
        
        String dateStr = document.getString("date");
        if (dateStr != null) {
            record.setDate(LocalDate.parse(dateStr));
        }
        
        String arrivalTimeStr = document.getString("arrivalTime");
        if (arrivalTimeStr != null) {
            record.setArrivalTime(LocalTime.parse(arrivalTimeStr));
        }
        
        String statusStr = document.getString("status");
        if (statusStr != null) {
            record.setStatus(AttendanceRecord.AttendanceStatus.fromString(statusStr));
        }
        
        record.setMethod(document.getString("method"));
        record.setRemarks(document.getString("remarks"));
        record.setRecordedBy(document.getString("recordedBy"));
        
        Date timestamp = document.getDate("timestamp");
        if (timestamp != null) {
            record.setTimestamp(LocalDateTime.ofInstant(timestamp.toInstant(), ZoneId.systemDefault()));
        }
        
        Date createdAt = document.getDate("createdAt");
        if (createdAt != null) {
            record.setCreatedAt(LocalDateTime.ofInstant(createdAt.toInstant(), ZoneId.systemDefault()));
        }
        
        Date updatedAt = document.getDate("updatedAt");
        if (updatedAt != null) {
            record.setUpdatedAt(LocalDateTime.ofInstant(updatedAt.toInstant(), ZoneId.systemDefault()));
        }
        
        return record;
    }
}