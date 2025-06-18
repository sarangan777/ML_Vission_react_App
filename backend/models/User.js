const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('crypto');

class User {
  static async findByCredentials(identifier, isAdmin = false) {
    try {
      let query, params;
      
      if (isAdmin) {
        query = 'SELECT * FROM users WHERE admin_id = ? AND role = "admin" AND is_active = TRUE';
        params = [identifier];
      } else {
        query = 'SELECT * FROM users WHERE registration_number = ? AND role = "student" AND is_active = TRUE';
        params = [identifier];
      }
      
      const [rows] = await pool.execute(query, params);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async create(userData) {
    try {
      const id = uuidv4();
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const query = `
        INSERT INTO users (
          id, registration_number, admin_id, name, email, password_hash, 
          role, department, year, type, birth_date, admin_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        id,
        userData.registrationNumber || null,
        userData.adminId || null,
        userData.name,
        userData.email,
        hashedPassword,
        userData.role || 'student',
        userData.department,
        userData.year || null,
        userData.type || null,
        userData.birthDate || null,
        userData.adminLevel || 'regular'
      ];
      
      await pool.execute(query, params);
      
      // Return user without password
      const newUser = await this.findById(id);
      delete newUser.password_hash;
      return newUser;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('User with this email or registration number already exists');
      }
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async update(id, updateData) {
    try {
      const allowedFields = ['name', 'email', 'department', 'year', 'type', 'birth_date', 'profile_picture'];
      const updates = [];
      const values = [];
      
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          updates.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });
      
      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      values.push(id);
      
      const query = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      await pool.execute(query, values);
      
      return await this.findById(id);
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async updatePassword(id, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.execute(
        'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, id]
      );
      return true;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAll(filters = {}) {
    try {
      let query = 'SELECT id, registration_number, admin_id, name, email, role, department, year, type, birth_date, profile_picture, admin_level, is_active, created_at FROM users WHERE is_active = TRUE';
      const params = [];
      
      if (filters.role) {
        query += ' AND role = ?';
        params.push(filters.role);
      }
      
      if (filters.department) {
        query += ' AND department = ?';
        params.push(filters.department);
      }
      
      if (filters.year) {
        query += ' AND year = ?';
        params.push(filters.year);
      }
      
      if (filters.search) {
        query += ' AND (name LIKE ? OR email LIKE ? OR registration_number LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      await pool.execute(
        'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      return true;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
}

module.exports = User;