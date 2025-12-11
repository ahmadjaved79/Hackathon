import express from 'express';
import cors from 'cors';
import { pool } from './db';
import ExcelJS from "exceljs";
import { format } from "date-fns";
import { Request, Response } from 'express';
import { QueryResult } from 'pg';
  
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});
// ==================== TYPES & INTERFACES ====================

interface MarkAttendanceRequest {
  student_id: number;
  date: string;
  day_order: number;
  year: number;
  section_name: string;
  period_0?: number;
  period_1?: number;
  period_2?: number;
  period_3?: number;
  period_4?: number;
  period_5?: number;
  period_6?: number;
  period_7?: number;
}

interface BatchAttendanceStudent {
  student_id: number;
  year: number;
  section_name: string;
  period_0?: number;
  period_1?: number;
  period_2?: number;
  period_3?: number;
  period_4?: number;
  period_5?: number;
  period_6?: number;
  period_7?: number;
}

interface BatchAttendanceRequest {
  students: BatchAttendanceStudent[];
  date: string;
  day_order: number;
}

interface UpdatePeriodRequest {
  student_id: number;
  date: string;
  period_number: number;
  status: number;
}

interface MarkAllPeriodRequest {
  date: string;
  section_id: number;
  year: number;
  period_number: number;
  status: number;
  day_order: number;
}

// ==================== CORE ATTENDANCE MARKING API ====================

// 1. Mark/Update Attendance for Single Student (MAIN ENDPOINT)
app.post('/api/admin/attendance/mark-student', async (req: Request, res: Response): Promise<void> => {
  const { 
    student_id, 
    date, 
    day_order, 
    year, 
    section_name,
    period_0 = -1,
    period_1 = -1,
    period_2 = -1,
    period_3 = -1,
    period_4 = -1,
    period_5 = -1,
    period_6 = -1,
    period_7 = -1
  }: MarkAttendanceRequest = req.body;

  try {
    // Check if attendance record already exists for this student on this date
    const existingRecord: QueryResult = await pool.query(
      'SELECT id FROM attendance_records WHERE student_id = $1 AND date = $2',
      [student_id, date]
    );

    if (existingRecord.rows.length > 0) {
      // UPDATE existing record
      const result: QueryResult = await pool.query(
        `UPDATE attendance_records 
         SET day_order = $1,
             year = $2,
             section_name = $3,
             period_0 = $4,
             period_1 = $5,
             period_2 = $6,
             period_3 = $7,
             period_4 = $8,
             period_5 = $9,
             period_6 = $10,
             period_7 = $11
         WHERE student_id = $12 AND date = $13
         RETURNING *`,
        [
          day_order, year, section_name,
          period_0, period_1, period_2, period_3,
          period_4, period_5, period_6, period_7,
          student_id, date
        ]
      );

      res.json({
        success: true,
        message: 'Attendance updated successfully',
        action: 'updated',
        record: result.rows[0]
      });

    } else {
      // INSERT new record
      const result: QueryResult = await pool.query(
        `INSERT INTO attendance_records (
          student_id, date, day_order, year, section_name,
          period_0, period_1, period_2, period_3,
          period_4, period_5, period_6, period_7
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          student_id, date, day_order, year, section_name,
          period_0, period_1, period_2, period_3,
          period_4, period_5, period_6, period_7
        ]
      );

      res.json({
        success: true,
        message: 'Attendance marked successfully',
        action: 'created',
        record: result.rows[0]
      });
    }

  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// 2. Mark Attendance for Multiple Students at Once (Batch Processing)
app.post('/api/admin/attendance/mark-batch', async (req: Request, res: Response): Promise<void> => {
  const { students, date, day_order }: BatchAttendanceRequest = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const results = {
      created: 0,
      updated: 0,
      errors: [] as Array<{ student_id: number; error: string }>
    };

    for (const student of students) {
      try {
        // Check if record exists
        const existing: QueryResult = await client.query(
          'SELECT id FROM attendance_records WHERE student_id = $1 AND date = $2',
          [student.student_id, date]
        );

        if (existing.rows.length > 0) {
          // UPDATE
          await client.query(
            `UPDATE attendance_records 
             SET day_order = $1,
                 year = $2,
                 section_name = $3,
                 period_0 = $4,
                 period_1 = $5,
                 period_2 = $6,
                 period_3 = $7,
                 period_4 = $8,
                 period_5 = $9,
                 period_6 = $10,
                 period_7 = $11
             WHERE student_id = $12 AND date = $13`,
            [
              day_order,
              student.year,
              student.section_name,
              student.period_0 ?? -1,
              student.period_1 ?? -1,
              student.period_2 ?? -1,
              student.period_3 ?? -1,
              student.period_4 ?? -1,
              student.period_5 ?? -1,
              student.period_6 ?? -1,
              student.period_7 ?? -1,
              student.student_id,
              date
            ]
          );
          results.updated++;
        } else {
          // INSERT
          await client.query(
            `INSERT INTO attendance_records (
              student_id, date, day_order, year, section_name,
              period_0, period_1, period_2, period_3,
              period_4, period_5, period_6, period_7
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              student.student_id,
              date,
              day_order,
              student.year,
              student.section_name,
              student.period_0 ?? -1,
              student.period_1 ?? -1,
              student.period_2 ?? -1,
              student.period_3 ?? -1,
              student.period_4 ?? -1,
              student.period_5 ?? -1,
              student.period_6 ?? -1,
              student.period_7 ?? -1
            ]
          );
          results.created++;
        }
      } catch (err: any) {
        results.errors.push({
          student_id: student.student_id,
          error: err.message
        });
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Attendance marked: ${results.created} created, ${results.updated} updated`,
      results
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error batch marking attendance:', error);
    res.status(500).json({ error: 'Failed to mark batch attendance' });
  } finally {
    client.release();
  }
});

// 3. Update Single Period for a Student (Quick Edit)
app.put('/api/admin/attendance/update-period', async (req: Request, res: Response): Promise<void> => {
  const { student_id, date, period_number, status }: UpdatePeriodRequest = req.body;

  try {
    if (period_number < 0 || period_number > 7) {
      res.status(400).json({ error: 'Invalid period number. Must be 0-7' });
      return;
    }

    if (Number(status)<-1 || Number(status)>1){
      res.status(400).json({ error: 'Invalid status. Must be -1, 0, or 1' });
      return;
    }

    const periodColumn: string = `period_${period_number}`;

    const result: QueryResult = await pool.query(
      `UPDATE attendance_records 
       SET ${periodColumn} = $1
       WHERE student_id = $2 AND date = $3
       RETURNING *`,
      [status, student_id, date]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Attendance record not found for this student and date' });
      return;
    }

    res.json({
      success: true,
      message: `Period ${period_number} updated successfully`,
      record: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating period:', error);
    res.status(500).json({ error: 'Failed to update period' });
  }
});

// 4. Get Attendance for a Specific Date and Section (for marking interface)
app.get('/api/admin/attendance/by-date-section', async (req: Request, res: Response): Promise<void> => {
  const { date, section_id, year } = req.query;

  try {
    if (!date || !section_id || !year) {
      res.status(400).json({ error: 'date, section_id, and year are required' });
      return;
    }

    // Get section info
    const sectionResult: QueryResult = await pool.query(
      'SELECT section_name FROM sections WHERE id = $1',
      [section_id]
    );

    if (sectionResult.rows.length === 0) {
      res.status(404).json({ error: 'Section not found' });
      return;
    }

    const section_name: string = sectionResult.rows[0].section_name;

    // Get all students in this section
    const studentsResult: QueryResult = await pool.query(
      `SELECT id, roll_no, name, section_id, year 
       FROM students 
       WHERE section_id = $1 AND year = $2
       ORDER BY roll_no ASC`,
      [section_id, year]
    );

    // Get existing attendance records for this date
    const attendanceResult: QueryResult = await pool.query(
      `SELECT * FROM attendance_records 
       WHERE date = $1 AND section_name = $2 AND year = $3`,
      [date, section_name, year]
    );

    // Create a map of student_id to attendance record
    const attendanceMap: Record<number, any> = {};
    attendanceResult.rows.forEach(record => {
      attendanceMap[record.student_id] = record;
    });

    // Merge students with their attendance records
    const studentsWithAttendance = studentsResult.rows.map(student => {
      const attendance = attendanceMap[student.id];
      
      return {
        id: student.id,
        rollNo: student.roll_no,
        name: student.name,
        sectionId: student.section_id,
        year: student.year,
        attendance: attendance ? {
          id: attendance.id,
          date: attendance.date,
          dayOrder: attendance.day_order,
          period_0: attendance.period_0,
          period_1: attendance.period_1,
          period_2: attendance.period_2,
          period_3: attendance.period_3,
          period_4: attendance.period_4,
          period_5: attendance.period_5,
          period_6: attendance.period_6,
          period_7: attendance.period_7
        } : {
          id: null,
          date: date,
          dayOrder: null,
          period_0: -1,
          period_1: -1,
          period_2: -1,
          period_3: -1,
          period_4: -1,
          period_5: -1,
          period_6: -1,
          period_7: -1
        }
      };
    });

    res.json({
      date,
      section_name,
      year,
      totalStudents: studentsWithAttendance.length,
      students: studentsWithAttendance
    });

  } catch (error) {
    console.error('Error fetching attendance by date and section:', error);
    res.status(500).json({ error: 'Failed to fetch attendance data' });
  }
});

// 5. Mark All Students Present/Absent for a Period (Quick Actions)
app.post('/api/admin/attendance/mark-all-period', async (req: Request, res: Response): Promise<void> => {
  const { date, section_id, year, period_number, status, day_order }: MarkAllPeriodRequest = req.body;

  const client = await pool.connect();

  try {
    if (period_number < 0 || period_number > 7) {
      res.status(400).json({ error: 'Invalid period number. Must be 0-7' });
      return;
    }

    if (![0, 1].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be 0 (absent) or 1 (present)' });
      return;
    }

    await client.query('BEGIN');

    // Get section name
    const sectionResult: QueryResult = await client.query(
      'SELECT section_name FROM sections WHERE id = $1',
      [section_id]
    );

    if (sectionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Section not found' });
      return;
    }

    const section_name: string = sectionResult.rows[0].section_name;

    // Get all students in this section
    const studentsResult: QueryResult = await client.query(
      'SELECT id FROM students WHERE section_id = $1 AND year = $2',
      [section_id, year]
    );

    const periodColumn: string = `period_${period_number}`;
    let updatedCount: number = 0;
    let createdCount: number = 0;

    for (const student of studentsResult.rows) {
      // Check if record exists
      const existing: QueryResult = await client.query(
        'SELECT id FROM attendance_records WHERE student_id = $1 AND date = $2',
        [student.id, date]
      );

      if (existing.rows.length > 0) {
        // UPDATE
        await client.query(
          `UPDATE attendance_records 
           SET ${periodColumn} = $1, day_order = $2
           WHERE student_id = $3 AND date = $4`,
          [status, day_order, student.id, date]
        );
        updatedCount++;
      } else {
        // INSERT
        const periods: Record<string, number> = {
          period_0: -1,
          period_1: -1,
          period_2: -1,
          period_3: -1,
          period_4: -1,
          period_5: -1,
          period_6: -1,
          period_7: -1
        };
        periods[periodColumn] = status;

        await client.query(
          `INSERT INTO attendance_records (
            student_id, date, day_order, year, section_name,
            period_0, period_1, period_2, period_3,
            period_4, period_5, period_6, period_7
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            student.id, date, day_order, year, section_name,
            periods.period_0, periods.period_1, periods.period_2, periods.period_3,
            periods.period_4, periods.period_5, periods.period_6, periods.period_7
          ]
        );
        createdCount++;
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Period ${period_number} marked ${status === 1 ? 'present' : 'absent'} for all students`,
      updatedCount,
      createdCount,
      totalStudents: studentsResult.rows.length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error marking all students for period:', error);
    res.status(500).json({ error: 'Failed to mark attendance for all students' });
  } finally {
    client.release();
  }
});

// 6. Check if Attendance Exists for Date/Section
app.get('/api/admin/attendance/check-exists', async (req: Request, res: Response): Promise<void> => {
  const { date, section_name, year } = req.query;

  try {
    const result: QueryResult = await pool.query(
      'SELECT COUNT(*) as count FROM attendance_records WHERE date = $1 AND section_name = $2 AND year = $3',
      [date, section_name, year]
    );

    const count: number = parseInt(result.rows[0].count);

    res.json({
      exists: count > 0,
      recordCount: count
    });

  } catch (error) {
    console.error('Error checking attendance existence:', error);
    res.status(500).json({ error: 'Failed to check attendance' });
  }
});

// ==================== AUTHENTICATION ROUTES ====================

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Query user by username
    const result = await pool.query(
      'SELECT id, username, role, is_active FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Update last login timestamp
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Return user info (excluding password)
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register new user (admin only - add middleware for protection)
app.post('/api/auth/register', async (req, res) => {
  const { username, password, role } = req.body;

  try {
    // Check if username already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, password, role]
    );

    res.status(201).json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get all users (admin only)
app.get('/api/auth/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, role, created_at, last_login, is_active FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role (admin only)
app.put('/api/auth/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role',
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Deactivate/Activate user (admin only)
app.put('/api/auth/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  try {
    const result = await pool.query(
      'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, username, is_active',
      [is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Delete user (admin only)
app.delete('/api/auth/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Change password
app.put('/api/auth/change-password', async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;

  try {
    // Verify old password
    const result = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND password = $2',
      [userId, oldPassword]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [newPassword, userId]
    );

    res.json({ success: true, message: 'Password changed successfully' });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});
      
// ==================== BRANCHES ROUTES ====================
// Get all sections
app.get('/api/sections', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sections ORDER BY section_name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

// Create or Update section (UPSERT based on section_name + year)
app.post('/api/sections/upsert', async (req, res) => {
  const { section_name, year } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO sections (section_name, year)
       VALUES ($1, $2)
       ON CONFLICT (section_name, year) DO UPDATE SET year = EXCLUDED.year
       RETURNING *`,
      [section_name, year]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving section:', error);
    res.status(500).json({ error: 'Failed to save section' });
  }
});

// Update section by ID
app.put('/api/sections/:id', async (req, res) => {
  const { id } = req.params;
  const { section_name, year } = req.body;

  try {
    const result = await pool.query(
      `UPDATE sections SET section_name=$1, year=$2 WHERE id=$3 RETURNING *`,
      [section_name, year, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({ error: 'Failed to update section' });
  }
});

// Delete section
app.delete('/api/sections/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM sections WHERE id=$1', [req.params.id]);
    res.json({ message: "Section removed successfully" });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ error: 'Failed to remove section' });
  }
});
      

// ==================== STUDENTS ROUTES ===================
// Get students by section
app.get('/api/students/section/:sectionId', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM students WHERE section_id=$1 ORDER BY roll_no ASC",
      [req.params.sectionId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error loading students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// Get ALL students
app.get('/api/students', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM students ORDER BY roll_no ASC");
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// Define interface for student data
interface Student {
  id: number;
  roll_no: string;
  name: string;
  year: number;
  section_id: number;
  // Add any other fields that exist in your students table
}

interface StudentQueryParams {
  section_id?: string;
  year?: string;
}

app.get('/api/smartshala/students', async (req: Request<{}, {}, {}, StudentQueryParams>, res: Response): Promise<Response | void> => {
  const { section_id, year } = req.query;

  try {
    let query = "SELECT * FROM students WHERE 1=1";
    const params: (string | number)[] = [];

    if (section_id) { 
      params.push(section_id); 
      query += ` AND section_id=$${params.length}`;
    }
    if (year) { 
      params.push(year); 
      query += ` AND year=$${params.length}`;
    }

    query += " ORDER BY roll_no ASC";

    const result: QueryResult<Student> = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err); // It's good practice to log the error
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// Insert multiple students
app.post('/api/students/batch', async (req, res) => {
  const { students } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const s of students) {
      await client.query(
        `INSERT INTO students (roll_no, name, section_id, year) VALUES ($1,$2,$3,$4)`,
        [s.roll_no, s.name, s.section_id, s.year]
      );
    }

    await client.query('COMMIT');
    res.json({ message: "Students added successfully" });

  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: "Failed to insert students" });
  } finally {
    client.release();
  }
});

// Delete students by section
app.delete('/api/students/section/:sectionId', async (req, res) => {
  try {
    await pool.query("DELETE FROM students WHERE section_id=$1", [req.params.sectionId]);
    res.json({ message: "Students removed successfully" });
  } catch {
    res.status(500).json({ error: "Failed to delete students" });
  }
});
  
// ==================== SMARTSHALA ROUTES ====================
app.get('/api/smartshala/sections', async (req, res) => {
  const { year } = req.query;

  try {
    const result = await pool.query(
      year
        ? "SELECT * FROM sections WHERE year=$1 ORDER BY section_name ASC"
        : "SELECT * FROM sections ORDER BY section_name ASC",
      year ? [year] : []
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching sections:", err);
    res.status(500).json({ error: "Failed to fetch sections" });
  }
});


app.post('/api/smartshala/attendance', async (req, res) => {
  const { records } = req.body;
const client = await pool.connect();
  try {
    
    await client.query('BEGIN');

    for (const r of records) {
      await client.query(`
        INSERT INTO attendance_records(
          student_id, date, day_order, year, section_name,
          period_0, period_1, period_2, period_3,
          period_4, period_5, period_6, period_7
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      `, [
        r.student_id, r.date, r.day_order, r.year, r.section_name,
        r.period_0, r.period_1, r.period_2, r.period_3,
        r.period_4, r.period_5, r.period_6, r.period_7
      ]);
    }

    await client.query('COMMIT');
    res.json({ message: "Attendance saved successfully" });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: "Failed to insert attendance" });
  }
});

app.get('/api/smartshala/attendance', async (req, res) => {
  const { date, section_name, year } = req.query;

  let query = "SELECT * FROM attendance_records WHERE 1=1";
  const params = [];

  if (date)          { params.push(date);          query += ` AND date=$${params.length}` }
  if (section_name)  { params.push(section_name);  query += ` AND section_name=$${params.length}` }
  if (year)          { params.push(year);          query += ` AND year=$${params.length}` }

  query += " ORDER BY date DESC, day_order ASC";

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
});

app.delete('/api/smartshala/attendance/:id', async (req, res) => {
  try {
    await pool.query("DELETE FROM attendance_records WHERE id=$1", [req.params.id]);
    res.json({ message: "Attendance deleted" });
  } catch {
    res.status(500).json({ error: "Unable to delete record" });
  }
});


// ==================== MODULE 1: DASHBOARD & ANALYTICS ====================

// 1. Real-time Statistics - Get all key metrics
app.get('/api/admin/dashboard/stats', async (req, res) => {
  try {
    // Total students
    const studentsResult = await pool.query('SELECT COUNT(*) as total FROM students');
    const totalStudents = parseInt(studentsResult.rows[0].total);

    // Students by year
    const studentsByYear = await pool.query(`
      SELECT year, COUNT(*) as count 
      FROM students 
      GROUP BY year 
      ORDER BY year
    `);

    // Total sections
    const sectionsResult = await pool.query('SELECT COUNT(*) as total FROM sections');
    const totalSections = parseInt(sectionsResult.rows[0].total);

    // Today's attendance rate
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        SUM(
          (CASE WHEN period_0 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_1 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_2 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_3 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_4 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_5 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_6 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_7 = 1 THEN 1 ELSE 0 END)
        ) as present_count,
        SUM(
          (CASE WHEN period_0 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_1 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_2 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_3 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_4 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_5 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_6 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_7 != -1 THEN 1 ELSE 0 END)
        ) as total_marked
      FROM attendance_records
      WHERE date = $1
    `, [today]);

    const todayData = todayAttendance.rows[0];
    const todayAttendanceRate = todayData.total_marked > 0 
      ? ((todayData.present_count / todayData.total_marked) * 100).toFixed(2)
      : 0;

    // Active users count
    const usersResult = await pool.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      WHERE is_active = true 
      GROUP BY role
    `);

    // Low attendance students (below 75%)
    const lowAttendanceStudents = await pool.query(`
      WITH student_attendance AS (
        SELECT 
          student_id,
          SUM(
            (CASE WHEN period_0 = 1 THEN 1 ELSE 0 END) +
            (CASE WHEN period_1 = 1 THEN 1 ELSE 0 END) +
            (CASE WHEN period_2 = 1 THEN 1 ELSE 0 END) +
            (CASE WHEN period_3 = 1 THEN 1 ELSE 0 END) +
            (CASE WHEN period_4 = 1 THEN 1 ELSE 0 END) +
            (CASE WHEN period_5 = 1 THEN 1 ELSE 0 END) +
            (CASE WHEN period_6 = 1 THEN 1 ELSE 0 END) +
            (CASE WHEN period_7 = 1 THEN 1 ELSE 0 END)
          ) as present,
          SUM(
            (CASE WHEN period_0 != -1 THEN 1 ELSE 0 END) +
            (CASE WHEN period_1 != -1 THEN 1 ELSE 0 END) +
            (CASE WHEN period_2 != -1 THEN 1 ELSE 0 END) +
            (CASE WHEN period_3 != -1 THEN 1 ELSE 0 END) +
            (CASE WHEN period_4 != -1 THEN 1 ELSE 0 END) +
            (CASE WHEN period_5 != -1 THEN 1 ELSE 0 END) +
            (CASE WHEN period_6 != -1 THEN 1 ELSE 0 END) +
            (CASE WHEN period_7 != -1 THEN 1 ELSE 0 END)
          ) as total
        FROM attendance_records
        GROUP BY student_id
      )
      SELECT COUNT(*) as low_attendance_count
      FROM student_attendance
      WHERE total > 0 AND (present::float / total * 100) < 75
    `);

    res.json({
      totalStudents,
      studentsByYear: studentsByYear.rows,
      totalSections,
      todayAttendanceRate: Number(todayAttendanceRate),
      activeUsers: usersResult.rows,
      lowAttendanceCount: Number(lowAttendanceStudents.rows[0].low_attendance_count)
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// 2. Attendance Trends - Last N days
app.get('/api/admin/dashboard/attendance-trends', async (req, res) => {
  const { days = 30 } = req.query;

  try {
    const result = await pool.query(`
      SELECT 
        date,
        COUNT(DISTINCT student_id) as total_students,
        SUM(
          (CASE WHEN period_0 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_1 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_2 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_3 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_4 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_5 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_6 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_7 = 1 THEN 1 ELSE 0 END)
        ) as present_count,
        SUM(
          (CASE WHEN period_0 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_1 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_2 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_3 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_4 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_5 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_6 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_7 != -1 THEN 1 ELSE 0 END)
        ) as total_marked
      FROM attendance_records
      WHERE date >= CURRENT_DATE - INTERVAL '1 day' * $1
      GROUP BY date
      ORDER BY date DESC
    `, [Number(days)]);

    const trends = result.rows.map(row => ({
      date: row.date,
      totalStudents: Number(row.total_students),
      presentCount: Number(row.present_count),
      totalMarked: Number(row.total_marked),
      attendanceRate: row.total_marked > 0 
        ? Number(((row.present_count / row.total_marked) * 100).toFixed(2))
        : 0
    }));

    res.json(trends);

  } catch (error) {
    console.error('Error fetching attendance trends:', error);
    res.status(500).json({ error: 'Failed to fetch attendance trends' });
  }
});

// 3. Section-wise Attendance Comparison
app.get('/api/admin/dashboard/section-comparison', async (req, res) => {
  const { year, startDate, endDate } = req.query;

  try {
    const params = [];
    let idx = 1;

    let query = `
      SELECT 
        section_name,
        year,
        COUNT(DISTINCT student_id) as total_students,
        SUM(
          (CASE WHEN period_0 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_1 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_2 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_3 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_4 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_5 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_6 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_7 = 1 THEN 1 ELSE 0 END)
        ) as present_count,
        SUM(
          (CASE WHEN period_0 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_1 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_2 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_3 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_4 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_5 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_6 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_7 != -1 THEN 1 ELSE 0 END)
        ) as total_marked
      FROM attendance_records
      WHERE 1=1
    `;

    if (year) {
      query += ` AND year = $${idx++}`;
      params.push(year);
    }
    if (startDate && endDate) {
      query += ` AND date BETWEEN $${idx++} AND $${idx++}`;
      params.push(startDate, endDate);
    }

    query += `
      GROUP BY section_name, year
      ORDER BY section_name ASC
    `;

    const result = await pool.query(query, params);

    const formatted = result.rows.map(r => ({
      section: r.section_name,
      year: r.year,
      totalStudents: Number(r.total_students),
      presentCount: Number(r.present_count),
      totalMarked: Number(r.total_marked),
      attendanceRate:
        r.total_marked > 0 ? Number(((r.present_count / r.total_marked) * 100).toFixed(2)) : 0
    }));

    res.json(formatted);

  } catch (error) {
    console.error("Section comparison error:", error);
    res.status(500).json({ error: "Failed to fetch section comparison" });
  }
});

// 4. Period-wise Attendance Analysis (Which periods have most absences)
app.get('/api/admin/dashboard/period-analysis', async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    let dateFilter = '';
    const params = [];

    if (startDate) {
      params.push(startDate);
      dateFilter += ` AND date >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      dateFilter += ` AND date <= $${params.length}`;
    }

    const result = await pool.query(`
      SELECT 
        'Period 0' as period_name,
        SUM(CASE WHEN period_0 = 1 THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN period_0 = 0 THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN period_0 != -1 THEN 1 ELSE 0 END) as total_marked
      FROM attendance_records WHERE 1=1 ${dateFilter}
      
      UNION ALL
      
      SELECT 
        'Period 1' as period_name,
        SUM(CASE WHEN period_1 = 1 THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN period_1 = 0 THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN period_1 != -1 THEN 1 ELSE 0 END) as total_marked
      FROM attendance_records WHERE 1=1 ${dateFilter}
      
      UNION ALL
      
      SELECT 
        'Period 2' as period_name,
        SUM(CASE WHEN period_2 = 1 THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN period_2 = 0 THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN period_2 != -1 THEN 1 ELSE 0 END) as total_marked
      FROM attendance_records WHERE 1=1 ${dateFilter}
      
      UNION ALL
      
      SELECT 
        'Period 3' as period_name,
        SUM(CASE WHEN period_3 = 1 THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN period_3 = 0 THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN period_3 != -1 THEN 1 ELSE 0 END) as total_marked
      FROM attendance_records WHERE 1=1 ${dateFilter}
      
      UNION ALL
      
      SELECT 
        'Period 4' as period_name,
        SUM(CASE WHEN period_4 = 1 THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN period_4 = 0 THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN period_4 != -1 THEN 1 ELSE 0 END) as total_marked
      FROM attendance_records WHERE 1=1 ${dateFilter}
      
      UNION ALL
      
      SELECT 
        'Period 5' as period_name,
        SUM(CASE WHEN period_5 = 1 THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN period_5 = 0 THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN period_5 != -1 THEN 1 ELSE 0 END) as total_marked
      FROM attendance_records WHERE 1=1 ${dateFilter}
      
      UNION ALL
      
      SELECT 
        'Period 6' as period_name,
        SUM(CASE WHEN period_6 = 1 THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN period_6 = 0 THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN period_6 != -1 THEN 1 ELSE 0 END) as total_marked
      FROM attendance_records WHERE 1=1 ${dateFilter}
      
      UNION ALL
      
      SELECT 
        'Period 7' as period_name,
        SUM(CASE WHEN period_7 = 1 THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN period_7 = 0 THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN period_7 != -1 THEN 1 ELSE 0 END) as total_marked
      FROM attendance_records WHERE 1=1 ${dateFilter}
      
      ORDER BY period_name
    `, params);

    const analysis = result.rows.map(row => ({
      periodName: row.period_name,
      present: Number(row.present),
      absent: Number(row.absent),
      totalMarked: Number(row.total_marked),
      attendanceRate: row.total_marked > 0 
        ? Number(((row.present / row.total_marked) * 100).toFixed(2))
        : 0
    }));

    res.json(analysis);

  } catch (error) {
    console.error('Error fetching period analysis:', error);
    res.status(500).json({ error: 'Failed to fetch period analysis' });
  }
});

// 5. Top Performers & Critical Alerts (100% attendance and <75% attendance students)
app.get('/api/admin/dashboard/student-alerts', async (req, res) => {
  const { limit = 10, threshold = 75 } = req.query;

  try {
    const result = await pool.query(`
      WITH student_attendance AS (
        SELECT 
          s.id,
          s.roll_no,
          s.name,
          s.year,
          sec.section_name,
          SUM(
            (CASE WHEN ar.period_0 = 1 THEN 1 ELSE 0 END) +
            (CASE WHEN ar.period_1 = 1 THEN 1 ELSE 0 END) +
            (CASE WHEN ar.period_2 = 1 THEN 1 ELSE 0 END) +
            (CASE WHEN ar.period_3 = 1 THEN 1 ELSE 0 END) +
            (CASE WHEN ar.period_4 = 1 THEN 1 ELSE 0 END) +
            (CASE WHEN ar.period_5 = 1 THEN 1 ELSE 0 END) +
            (CASE WHEN ar.period_6 = 1 THEN 1 ELSE 0 END) +
            (CASE WHEN ar.period_7 = 1 THEN 1 ELSE 0 END)
          ) as present,
          SUM(
            (CASE WHEN ar.period_0 != -1 THEN 1 ELSE 0 END) +
            (CASE WHEN ar.period_1 != -1 THEN 1 ELSE 0 END) +
            (CASE WHEN ar.period_2 != -1 THEN 1 ELSE 0 END) +
            (CASE WHEN ar.period_3 != -1 THEN 1 ELSE 0 END) +
            (CASE WHEN ar.period_4 != -1 THEN 1 ELSE 0 END) +
            (CASE WHEN ar.period_5 != -1 THEN 1 ELSE 0 END) +
            (CASE WHEN ar.period_6 != -1 THEN 1 ELSE 0 END) +
            (CASE WHEN ar.period_7 != -1 THEN 1 ELSE 0 END)
          ) as total,
          COUNT(DISTINCT ar.date) as days_present
        FROM students s
        LEFT JOIN attendance_records ar ON s.id = ar.student_id
        LEFT JOIN sections sec ON s.section_id = sec.id
        GROUP BY s.id, s.roll_no, s.name, s.year, sec.section_name
        HAVING SUM(
          (CASE WHEN ar.period_0 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_1 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_2 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_3 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_4 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_5 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_6 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_7 != -1 THEN 1 ELSE 0 END)
        ) > 0
      )
      SELECT 
        id,
        roll_no,
        name,
        year,
        section_name,
        present,
        total,
        days_present,
        ROUND((present::numeric / NULLIF(total, 0) * 100), 2) as attendance_percentage
      FROM student_attendance
      ORDER BY attendance_percentage ASC
    `);

    const allStudents = result.rows.map(row => ({
      id: row.id,
      rollNo: row.roll_no,
      name: row.name,
      year: row.year,
      sectionName: row.section_name,
      present: Number(row.present),
      total: Number(row.total),
      daysPresent: Number(row.days_present),
      attendancePercentage: Number(row.attendance_percentage)
    }));

    // Top performers (100% or near 100%)
    const topPerformers = allStudents
      .filter(s => s.attendancePercentage >= 95)
      .slice(0, Number(limit));

    // Critical alerts (below threshold)
    const criticalAlerts = allStudents
      .filter(s => s.attendancePercentage < Number(threshold))
      .slice(0, Number(limit));

    res.json({
      topPerformers,
      criticalAlerts
    });

  } catch (error) {
    console.error('Error fetching student alerts:', error);
    res.status(500).json({ error: 'Failed to fetch student alerts' });
  }
});

// 6. Day-Order wise Attendance Pattern
app.get('/api/admin/dashboard/day-order-analysis', async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    let dateFilter = '';
    const params = [];

    if (startDate) {
      params.push(startDate);
      dateFilter += ` AND date >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      dateFilter += ` AND date <= $${params.length}`;
    }

    const result = await pool.query(`
      SELECT 
        day_order,
        COUNT(DISTINCT date) as total_days,
        COUNT(DISTINCT student_id) as total_students,
        SUM(
          (CASE WHEN period_0 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_1 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_2 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_3 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_4 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_5 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_6 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_7 = 1 THEN 1 ELSE 0 END)
        ) as present_count,
        SUM(
          (CASE WHEN period_0 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_1 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_2 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_3 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_4 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_5 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_6 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_7 != -1 THEN 1 ELSE 0 END)
        ) as total_marked
      FROM attendance_records
      WHERE 1=1 ${dateFilter}
      GROUP BY day_order
      ORDER BY day_order
    `, params);

    const analysis = result.rows.map(row => ({
      dayOrder: row.day_order,
      totalDays: Number(row.total_days),
      totalStudents: Number(row.total_students),
      presentCount: Number(row.present_count),
      totalMarked: Number(row.total_marked),
      attendanceRate: row.total_marked > 0 
        ? Number(((row.present_count / row.total_marked) * 100).toFixed(2))
        : 0
    }));

    res.json(analysis);

  } catch (error) {
    console.error('Error fetching day-order analysis:', error);
    res.status(500).json({ error: 'Failed to fetch day-order analysis' });
  }
});

// 7. Overall Summary Stats (for quick overview cards)
app.get('/api/admin/dashboard/summary', async (req, res) => {
  try {
    const summary = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM students) as total_students,
        (SELECT COUNT(*) FROM sections) as total_sections,
        (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
        (SELECT COUNT(DISTINCT date) FROM attendance_records) as total_attendance_days,
        (SELECT 
          ROUND(AVG(
            (present_count::numeric / NULLIF(total_marked, 0)) * 100
          ), 2)
          FROM (
            SELECT 
              date,
              SUM(
                (CASE WHEN period_0 = 1 THEN 1 ELSE 0 END) +
                (CASE WHEN period_1 = 1 THEN 1 ELSE 0 END) +
                (CASE WHEN period_2 = 1 THEN 1 ELSE 0 END) +
                (CASE WHEN period_3 = 1 THEN 1 ELSE 0 END) +
                (CASE WHEN period_4 = 1 THEN 1 ELSE 0 END) +
                (CASE WHEN period_5 = 1 THEN 1 ELSE 0 END) +
                (CASE WHEN period_6 = 1 THEN 1 ELSE 0 END) +
                (CASE WHEN period_7 = 1 THEN 1 ELSE 0 END)
              ) as present_count,
              SUM(
                (CASE WHEN period_0 != -1 THEN 1 ELSE 0 END) +
                (CASE WHEN period_1 != -1 THEN 1 ELSE 0 END) +
                (CASE WHEN period_2 != -1 THEN 1 ELSE 0 END) +
                (CASE WHEN period_3 != -1 THEN 1 ELSE 0 END) +
                (CASE WHEN period_4 != -1 THEN 1 ELSE 0 END) +
                (CASE WHEN period_5 != -1 THEN 1 ELSE 0 END) +
                (CASE WHEN period_6 != -1 THEN 1 ELSE 0 END) +
                (CASE WHEN period_7 != -1 THEN 1 ELSE 0 END)
              ) as total_marked
            FROM attendance_records
            GROUP BY date
          ) daily_stats
        ) as overall_attendance_avg
    `);

    res.json({
      totalStudents: Number(summary.rows[0].total_students),
      totalSections: Number(summary.rows[0].total_sections),
      activeUsers: Number(summary.rows[0].active_users),
      totalAttendanceDays: Number(summary.rows[0].total_attendance_days),
      overallAttendanceAvg: Number(summary.rows[0].overall_attendance_avg) || 0
    });

  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});
// ==================== MODULE 2: STUDENT MANAGEMENT ====================

// 1. Add Single Student
app.post('/api/admin/students', async (req, res) => {
  const { roll_no, name, section_id, year } = req.body;

  try {
    // Check if roll number already exists
    const existing = await pool.query(
      'SELECT id FROM students WHERE roll_no = $1',
      [roll_no]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Roll number already exists' });
    }

    const result = await pool.query(
      'INSERT INTO students (roll_no, name, section_id, year) VALUES ($1, $2, $3, $4) RETURNING *',
      [roll_no, name, section_id, year]
    );

    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      student: result.rows[0]
    });

  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ error: 'Failed to add student' });
  }
});

// 2. Bulk Add Students (CSV/Excel upload)
app.post('/api/admin/students/bulk', async (req, res) => {
  const { students } = req.body; // Array of student objects

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const addedStudents = [];
    const errors = [];

    for (const student of students) {
      try {
        // Check if roll number exists
        const existing = await client.query(
          'SELECT id FROM students WHERE roll_no = $1',
          [student.roll_no]
        );

        if (existing.rows.length > 0) {
          errors.push({
            roll_no: student.roll_no,
            error: 'Roll number already exists'
          });
          continue;
        }

        // Insert student
        const result = await client.query(
          'INSERT INTO students (roll_no, name, section_id, year) VALUES ($1, $2, $3, $4) RETURNING *',
          [student.roll_no, student.name, student.section_id, student.year]
        );

        addedStudents.push(result.rows[0]);

      } catch (err) {
        errors.push({
          roll_no: student.roll_no,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `${addedStudents.length} students added successfully`,
      addedCount: addedStudents.length,
      errorCount: errors.length,
      addedStudents,
      errors
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error bulk adding students:', error);
    res.status(500).json({ error: 'Failed to add students in bulk' });
  } finally {
    client.release();
  }
});

// 3. Get All Students with Advanced Filters
app.get('/api/admin/students', async (req, res) => {
  const { 
    search, 
    year, 
    section_id, 
    section_name,
    attendance_threshold,
    page = 1, 
    limit = 50,
    sort_by = 'roll_no',
    sort_order = 'ASC'
  } = req.query;

  try {
    let query = `
      SELECT 
        s.id,
        s.roll_no,
        s.name,
        s.section_id,
        s.year,
        sec.section_name,
        COUNT(DISTINCT ar.date) as total_days,
        SUM(
          (CASE WHEN ar.period_0 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_1 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_2 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_3 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_4 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_5 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_6 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_7 = 1 THEN 1 ELSE 0 END)
        ) as present_count,
        SUM(
          (CASE WHEN ar.period_0 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_1 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_2 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_3 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_4 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_5 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_6 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_7 != -1 THEN 1 ELSE 0 END)
        ) as total_marked
      FROM students s
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN attendance_records ar ON s.id = ar.student_id
      WHERE 1=1
    `;

    const params = [];

    // Search filter (roll_no or name)
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (s.roll_no ILIKE $${params.length} OR s.name ILIKE $${params.length})`;
    }

    // Year filter
    if (year) {
      params.push(year);
      query += ` AND s.year = $${params.length}`;
    }

    // Section ID filter
    if (section_id) {
      params.push(section_id);
      query += ` AND s.section_id = $${params.length}`;
    }

    // Section name filter
    if (section_name) {
      params.push(section_name);
      query += ` AND sec.section_name = $${params.length}`;
    }

    query += ` GROUP BY s.id, s.roll_no, s.name, s.section_id, s.year, sec.section_name`;

    // Attendance threshold filter (applied after grouping)
    if (attendance_threshold) {
      query += ` HAVING (
        SUM(
          (CASE WHEN ar.period_0 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_1 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_2 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_3 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_4 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_5 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_6 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_7 = 1 THEN 1 ELSE 0 END)
        )::float / NULLIF(SUM(
          (CASE WHEN ar.period_0 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_1 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_2 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_3 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_4 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_5 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_6 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN ar.period_7 != -1 THEN 1 ELSE 0 END)
        ), 0) * 100
      ) < ${Number(attendance_threshold)}`;
    }

    // Sorting
    const validSortColumns:any[] = ['roll_no', 'name', 'year', 'section_name'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'roll_no';
    const sortDirection = sort_order.toString().toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    if (sortColumn === 'section_name') {
      query += ` ORDER BY sec.section_name ${sortDirection}`;
    } else {
      query += ` ORDER BY s.${sortColumn} ${sortDirection}`;
    }

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), offset);

    // Execute query
    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT s.id) as total
      FROM students s
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN attendance_records ar ON s.id = ar.student_id
      WHERE 1=1
    `;

    const countParams = [];
    if (search) {
      countParams.push(`%${search}%`);
      countQuery += ` AND (s.roll_no ILIKE $${countParams.length} OR s.name ILIKE $${countParams.length})`;
    }
    if (year) {
      countParams.push(year);
      countQuery += ` AND s.year = $${countParams.length}`;
    }
    if (section_id) {
      countParams.push(section_id);
      countQuery += ` AND s.section_id = $${countParams.length}`;
    }
    if (section_name) {
      countParams.push(section_name);
      countQuery += ` AND sec.section_name = $${countParams.length}`;
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalRecords = Number(countResult.rows[0].total);

    // Format results
    const students = result.rows.map(row => ({
      id: row.id,
      roll_no: row.roll_no,
      name: row.name,
      section_id: row.section_id,
      year: row.year,
      sectionName: row.section_name,
      totalDays: Number(row.total_days) || 0,
      presentCount: Number(row.present_count) || 0,
      totalMarked: Number(row.total_marked) || 0,
      attendancePercentage: row.total_marked > 0 
        ? Number(((row.present_count / row.total_marked) * 100).toFixed(2))
        : 0
    }));

    res.json({
      students,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalRecords / Number(limit)),
        totalRecords,
        limit: Number(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// 4. Get Student by ID (Detailed Profile)
app.get('/api/admin/students/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Get student basic info
    const studentResult = await pool.query(`
      SELECT s.*, sec.section_name
      FROM students s
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE s.id = $1
    `, [id]);

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = studentResult.rows[0];

    // Get attendance summary
    const attendanceSummary = await pool.query(`
      SELECT 
        COUNT(DISTINCT date) as total_days,
        SUM(
          (CASE WHEN period_0 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_1 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_2 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_3 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_4 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_5 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_6 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_7 = 1 THEN 1 ELSE 0 END)
        ) as present_count,
        SUM(
          (CASE WHEN period_0 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_1 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_2 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_3 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_4 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_5 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_6 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_7 != -1 THEN 1 ELSE 0 END)
        ) as total_marked
      FROM attendance_records
      WHERE student_id = $1
    `, [id]);

    const summary = attendanceSummary.rows[0];

    // Get monthly attendance breakdown
    const monthlyAttendance = await pool.query(`
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        COUNT(DISTINCT date) as total_days,
        SUM(
          (CASE WHEN period_0 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_1 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_2 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_3 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_4 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_5 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_6 = 1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_7 = 1 THEN 1 ELSE 0 END)
        ) as present_count,
        SUM(
          (CASE WHEN period_0 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_1 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_2 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_3 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_4 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_5 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_6 != -1 THEN 1 ELSE 0 END) +
          (CASE WHEN period_7 != -1 THEN 1 ELSE 0 END)
        ) as total_marked
      FROM attendance_records
      WHERE student_id = $1
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `, [id]);

    // Get recent attendance records
    const recentAttendance = await pool.query(`
      SELECT 
        date,
        day_order,
        period_0, period_1, period_2, period_3,
        period_4, period_5, period_6, period_7
      FROM attendance_records
      WHERE student_id = $1
      ORDER BY date DESC
      LIMIT 30
    `, [id]);

    res.json({
      student: {
        id: student.id,
        roll_no: student.roll_no,
        name: student.name,
        section_id: student.section_id,
        sectionName: student.section_name,
        year: student.year
      },
      attendanceSummary: {
        totalDays: Number(summary.total_days) || 0,
        presentCount: Number(summary.present_count) || 0,
        totalMarked: Number(summary.total_marked) || 0,
        attendancePercentage: summary.total_marked > 0 
          ? Number(((summary.present_count / summary.total_marked) * 100).toFixed(2))
          : 0
      },
      monthlyBreakdown: monthlyAttendance.rows.map(row => ({
        month: row.month,
        totalDays: Number(row.total_days),
        presentCount: Number(row.present_count),
        totalMarked: Number(row.total_marked),
        attendancePercentage: row.total_marked > 0 
          ? Number(((row.present_count / row.total_marked) * 100).toFixed(2))
          : 0
      })),
      recentAttendance: recentAttendance.rows
    });

  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ error: 'Failed to fetch student profile' });
  }
});

// 5. Update Student
app.put('/api/admin/students/:id', async (req, res) => {
  const { id } = req.params;
  const { roll_no, name, section_id, year } = req.body;

  try {
    // Check if new roll number conflicts with existing
    if (roll_no) {
      const existing = await pool.query(
        'SELECT id FROM students WHERE roll_no = $1 AND id != $2',
        [roll_no, id]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Roll number already exists' });
      }
    }

    const result = await pool.query(
      `UPDATE students 
       SET roll_no = COALESCE($1, roll_no),
           name = COALESCE($2, name),
           section_id = COALESCE($3, section_id),
           year = COALESCE($4, year)
       WHERE id = $5
       RETURNING *`,
      [roll_no, name, section_id, year, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      student: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// 6. Transfer Student (Change Section/Year)
app.put('/api/admin/students/:id/transfer', async (req, res) => {
  const { id } = req.params;
  const { new_section_id, new_year } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get current student info
    const studentResult = await client.query(
      'SELECT * FROM students WHERE id = $1',
      [id]
    );

    if (studentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Student not found' });
    }

    const oldStudent = studentResult.rows[0];

    // Update student
    const updateResult = await client.query(
      `UPDATE students 
       SET section_id = $1, year = $2
       WHERE id = $3
       RETURNING *`,
      [new_section_id, new_year, id]
    );

    // Get new section name
    const sectionResult = await client.query(
      'SELECT section_name FROM sections WHERE id = $1',
      [new_section_id]
    );

    // Update all future attendance records (optional - update section_name and year in attendance_records)
    await client.query(
      `UPDATE attendance_records 
       SET section_name = $1, year = $2
       WHERE student_id = $3 AND date >= CURRENT_DATE`,
      [sectionResult.rows[0].section_name, new_year, id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Student transferred successfully',
      oldSection: oldStudent.section_id,
      oldYear: oldStudent.year,
      newSection: new_section_id,
      newYear: new_year,
      student: updateResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error transferring student:', error);
    res.status(500).json({ error: 'Failed to transfer student' });
  } finally {
    client.release();
  }
});

// 7. Delete Single Student
app.delete('/api/admin/students/:id', async (req, res) => {
  const { id } = req.params;
  const { hard_delete = false } = req.query; // soft delete vs hard delete

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if student exists
    const studentResult = await client.query(
      'SELECT * FROM students WHERE id = $1',
      [id]
    );

    if (studentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Student not found' });
    }

    if (hard_delete === 'true') {
      // Hard delete - remove student and all attendance records
      await client.query('DELETE FROM attendance_records WHERE student_id = $1', [id]);
      await client.query('DELETE FROM students WHERE id = $1', [id]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Student and all attendance records permanently deleted'
      });

    } else {
      // Soft delete - just remove student, keep attendance records for history
      await client.query('DELETE FROM students WHERE id = $1', [id]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Student deleted (attendance records preserved)'
      });
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  } finally {
    client.release();
  }
});

// 8. Bulk Delete Students
app.delete('/api/admin/students/bulk', async (req, res) => {
  const { student_ids } = req.body; // Array of student IDs

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete attendance records
    await client.query(
      'DELETE FROM attendance_records WHERE student_id = ANY($1::bigint[])',
      [student_ids]
    );

    // Delete students
    const result = await client.query(
      'DELETE FROM students WHERE id = ANY($1::bigint[]) RETURNING id',
      [student_ids]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `${result.rows.length} students deleted successfully`,
      deletedCount: result.rows.length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error bulk deleting students:', error);
    res.status(500).json({ error: 'Failed to delete students' });
  } finally {
    client.release();
  }
});

// 9. Delete Students by Section
app.delete('/api/admin/students/section/:sectionId', async (req, res) => {
  const { sectionId } = req.params;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get all student IDs in this section
    const studentIds = await client.query(
      'SELECT id FROM students WHERE section_id = $1',
      [sectionId]
    );

    if (studentIds.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.json({
        success: true,
        message: 'No students found in this section',
        deletedCount: 0
      });
    }

    const ids = studentIds.rows.map(row => row.id);

    // Delete attendance records
    await client.query(
      'DELETE FROM attendance_records WHERE student_id = ANY($1::bigint[])',
      [ids]
    );

    // Delete students
    await client.query(
      'DELETE FROM students WHERE section_id = $1',
      [sectionId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `${ids.length} students deleted from section`,
      deletedCount: ids.length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting students by section:', error);
    res.status(500).json({ error: 'Failed to delete students' });
  } finally {
    client.release();
  }
});

// 10. Search Students (Quick Search)
app.get('/api/admin/students/search', async (req, res) => {
  const { q } = req.query; // Search query

  if (!q || q.toString().trim() === '') {
    return res.json([]);
  }

  try {
    const result = await pool.query(`
      SELECT s.id, s.roll_no, s.name, s.year, sec.section_name
      FROM students s
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE s.roll_no ILIKE $1 OR s.name ILIKE $1
      ORDER BY s.roll_no ASC
      LIMIT 20
    `, [`%${q}%`]);

    res.json(result.rows);

  } catch (error) {
    console.error('Error searching students:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// 11. Get Student Attendance Calendar (for calendar view)
app.get('/api/admin/students/:id/attendance-calendar', async (req, res) => {
  const { id } = req.params;
  const { month, year } = req.query; // Optional: filter by month/year

  try {
    let query = `
      SELECT 
        date,
        day_order,
        period_0, period_1, period_2, period_3,
        period_4, period_5, period_6, period_7
      FROM attendance_records
      WHERE student_id = $1
    `;

    const params:any[] = [id];

    if (month && year) {
      params.push(year, month);
      query += ` AND EXTRACT(YEAR FROM date) = $2 AND EXTRACT(MONTH FROM date) = $3`;
    }

    query += ` ORDER BY date DESC`;

    const result = await pool.query(query, params);

    const calendar = result.rows.map(row => {
      const periods = [
        row.period_0, row.period_1, row.period_2, row.period_3,
        row.period_4, row.period_5, row.period_6, row.period_7
      ];

      const markedPeriods = periods.filter(p => p !== -1).length;
      const presentPeriods = periods.filter(p => p === 1).length;

      return {
        date: row.date,
        dayOrder: row.day_order,
        periods: {
          period_0: row.period_0,
          period_1: row.period_1,
          period_2: row.period_2,
          period_3: row.period_3,
          period_4: row.period_4,
          period_5: row.period_5,
          period_6: row.period_6,
          period_7: row.period_7
        },
        markedPeriods,
        presentPeriods,
        attendanceRate: markedPeriods > 0 
          ? Number(((presentPeriods / markedPeriods) * 100).toFixed(2))
          : 0
      };
    });

    res.json(calendar);

  } catch (error) {
    console.error('Error fetching attendance calendar:', error);
    res.status(500).json({ error: 'Failed to fetch attendance calendar' });
  }
});

// ================== EXPORT STUDENT ATTENDANCE EXCEL ==================
app.get('/api/admin/attendance/export/student/:student_id', async (req, res) => {
  const { student_id } = req.params;
  const { startDate, endDate } = req.query;   // optional filters

  try {
    let query = `
      SELECT 
        s.roll_no,
        s.name,
        sec.section_name,
        ar.date,
        ar.day_order,
        ar.year,
        ar.period_0, ar.period_1, ar.period_2, ar.period_3,
        ar.period_4, ar.period_5, ar.period_6, ar.period_7
      FROM attendance_records ar
      JOIN students s ON ar.student_id = s.id
      JOIN sections sec ON s.section_id = sec.id
      WHERE ar.student_id = $1
    `;

    const params:any[] = [student_id];
    if (startDate && endDate) {
      params.push(startDate, endDate);
      query += ` AND ar.date BETWEEN $2 AND $3`;
    }

    query += ` ORDER BY ar.date ASC`;

    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ message: "No records found" });

    const student = result.rows[0];

    // ================== CREATE EXCEL ==================
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Attendance Report");

    // Header Info
    sheet.addRow([`Attendance Report - ${student.name} (${student.roll_no})`]);
    sheet.addRow([`Section: ${student.section_name} | Year: ${student.year}`]);
    sheet.addRow([``]);

    // Table Header Row
    sheet.addRow([
      "Date", "Day Order", 
      "P0", "P1", "P2", "P3", 
      "P4", "P5", "P6", "P7", 
      "Present Count", "Absent Count", "Attendance %"
    ]);

    // ================== FILL ROWS ==================
    result.rows.forEach(r => {
      const periods = [
        r.period_0, r.period_1, r.period_2, r.period_3,
        r.period_4, r.period_5, r.period_6, r.period_7
      ];

      const present = periods.filter(p => p === 1).length;
      const absent = periods.filter(p => p === 0).length;
      const percent = present + absent > 0 ? ((present/(present+absent))*100).toFixed(2) : "0";

      sheet.addRow([
        format(new Date(r.date), "dd-MM-yyyy"),
        r.day_order,
        ...periods,
        present,
        absent,
        percent+"%"
      ]);
    });

    // Auto column width
    sheet.columns.forEach(col => col.width = 12);

    // ================== SEND AS FILE ==================
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=attendance_${student.roll_no}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Excel Export Error:", error);
    res.status(500).json({ error: "Failed to generate attendance Excel file" });
  }
});


// Define interfaces for type safety
interface AttendanceRecord {
  student_id: number;
  roll_no: string;
  name: string;
  year: number;
  section_name: string;
  date: Date;
  day_order: number;
  period_0: number;
  period_1: number;
  period_2: number;
  period_3: number;
  period_4: number;
  period_5: number;
  period_6: number;
  period_7: number;
}

interface GroupedRecords {
  [student_id: string]: AttendanceRecord[];
}

interface ExportQueryParams {
  year?: string;
  section_id?: string;
}

app.get('/api/admin/attendance/export/all', async (req: Request<{}, {}, {}, ExportQueryParams>, res: Response): Promise<Response | void> => {
  const { year, section_id } = req.query;

  try {
    let query = `
      SELECT 
        s.id as student_id,
        s.roll_no,
        s.name,
        s.year,
        sec.section_name,
        ar.date,
        ar.day_order,
        ar.period_0, ar.period_1, ar.period_2, ar.period_3,
        ar.period_4, ar.period_5, ar.period_6, ar.period_7
      FROM attendance_records ar
      JOIN students s ON ar.student_id = s.id
      JOIN sections sec ON s.section_id = sec.id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];
    if (year) { 
      params.push(year); 
      query += ` AND s.year = $${params.length}`;
    }
    if (section_id) { 
      params.push(section_id); 
      query += ` AND s.section_id = $${params.length}`;
    }

    query += ` ORDER BY s.roll_no ASC, ar.date ASC`;

    const result: QueryResult<AttendanceRecord> = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.json({ message: "No attendance data available" });
    }

    const workbook = new ExcelJS.Workbook();

    // ========================== MODE A — One Sheet Per Student ==========================
    const grouped: GroupedRecords = {};
    result.rows.forEach((r: AttendanceRecord) => {
      if (!grouped[r.student_id]) {
        grouped[r.student_id] = [];
      }
      grouped[r.student_id].push(r);
    });

    Object.keys(grouped).forEach((student_id: string) => {
      const records: AttendanceRecord[] = grouped[student_id];
      const st: AttendanceRecord = records[0];

      const sheet = workbook.addWorksheet(`${st.roll_no}-${st.name}`);

      sheet.addRow([`Attendance Report — ${st.name} (${st.roll_no})`]);
      sheet.addRow([`Section: ${st.section_name} | Year: ${st.year}`]);
      sheet.addRow([``]);

      sheet.addRow([
        "Date", "Day", "P0", "P1", "P2", "P3", "P4", "P5", "P6", "P7",
        "Present", "Absent", "Attendance %"
      ]);

      records.forEach((r: AttendanceRecord) => {
        const p: number[] = [
          r.period_0, r.period_1, r.period_2, r.period_3,
          r.period_4, r.period_5, r.period_6, r.period_7
        ];
        const present: number = p.filter((v: number) => v === 1).length;
        const absent: number = p.filter((v: number) => v === 0).length;
        
        sheet.addRow([
          format(new Date(r.date), "dd-MM-yyyy"), 
          r.day_order,
          ...p, 
          present, 
          absent,
          ((present / (present + absent)) * 100 || 0).toFixed(2) + "%"
        ]);
      });

      sheet.columns.forEach((c) => {
        c.width = 12;
      });
    });

    // ========================== MODE B — SINGLE MASTER SHEET ==========================
    const master = workbook.addWorksheet("All Students Report");

    master.addRow([
      "Roll No", "Name", "Year", "Section", "Date", "Day",
      "P0", "P1", "P2", "P3", "P4", "P5", "P6", "P7",
      "Present", "Absent", "Attendance %"
    ]);

    result.rows.forEach((r: AttendanceRecord) => {
      const p: number[] = [
        r.period_0, r.period_1, r.period_2, r.period_3,
        r.period_4, r.period_5, r.period_6, r.period_7
      ];

      const present: number = p.filter((v: number) => v === 1).length;
      const absent: number = p.filter((v: number) => v === 0).length;

      master.addRow([
        r.roll_no,
        r.name,
        r.year,
        r.section_name,
        format(new Date(r.date), "dd-MM-yyyy"),
        r.day_order,
        ...p,
        present,
        absent,
        ((present / (present + absent)) * 100 || 0).toFixed(2) + "%"
      ]);
    });

    master.columns.forEach((c) => {
      c.width = 13;
    });

    // ==========================================================
    //  SEND FILE
    // ==========================================================
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance_export_all.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export excel" });
  }
});
    
    
                          
// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});
