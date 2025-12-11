// ============================================================================
// COMPREHENSIVE API CLIENT FOR ATTENDANCE SYSTEM
// ============================================================================
// This file provides complete wrapper functions for all Express backend endpoints
// with full type safety, error handling, and organized sections

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// Auth Types
export interface User {
  id: number;
  username: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
}

export interface UserDetails extends User {
  created_at: string;
  last_login: string;
  is_active: boolean;
}

// Student Types
export interface Student {
  id: number;
  roll_no: string;
  name: string;
  section_id: number;
  year: number;
}

export interface StudentWithAttendance extends Student {
  sectionName?: string;
  totalDays: number;
  presentCount: number;
  totalMarked: number;
  attendancePercentage: number;
}

export interface StudentProfile {
  student: Omit<StudentWithAttendance, 'totalDays' | 'presentCount' | 'totalMarked' | 'attendancePercentage'> & { sectionName: string };
  attendanceSummary: {
    totalDays: number;
    presentCount: number;
    totalMarked: number;
    attendancePercentage: number;
  };
  monthlyBreakdown: Array<{
    month: string;
    totalDays: number;
    presentCount: number;
    totalMarked: number;
    attendancePercentage: number;
  }>;
  recentAttendance: AttendanceRecord[];
}

// Section Types
export interface Section {
  id: number;
  section_name: string;
  year: number;
}

// Attendance Types
export interface AttendanceRecord {
  id?: number;
  student_id: number;
  date: string;
  day_order: number;
  year: number;
  section_name: string;
  period_0: number;
  period_1: number;
  period_2: number;
  period_3: number;
  period_4: number;
  period_5: number;
  period_6: number;
  period_7: number;
}

export interface StudentWithAttendanceData {
  id: number;
  rollNo: string;
  name: string;
  sectionId: number;
  year: number;
  attendance: {
    id: number | null;
    date: string;
    dayOrder: number | null;
    period_0: number;
    period_1: number;
    period_2: number;
    period_3: number;
    period_4: number;
    period_5: number;
    period_6: number;
    period_7: number;
  };
}

export interface AttendanceByDateSection {
  date: string;
  section_name: string;
  year: number;
  totalStudents: number;
  students: StudentWithAttendanceData[];
}

export interface BatchAttendanceStudent {
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

// Dashboard Types
export interface DashboardStats {
  totalStudents: number;
  studentsByYear: Array<{ year: number; count: number }>;
  totalSections: number;
  todayAttendanceRate: number;
  activeUsers: Array<{ role: string; count: number }>;
  lowAttendanceCount: number;
}

export interface AttendanceTrend {
  date: string;
  totalStudents: number;
  presentCount: number;
  totalMarked: number;
  attendanceRate: number;
}

export interface SectionComparison {
  section: string;
  year: number;
  totalStudents: number;
  presentCount: number;
  totalMarked: number;
  attendanceRate: number;
}

export interface PeriodAnalysis {
  periodName: string;
  present: number;
  absent: number;
  totalMarked: number;
  attendanceRate: number;
}

export interface StudentAlert {
  id: number;
  rollNo: string;
  name: string;
  year: number;
  sectionName: string;
  present: number;
  total: number;
  daysPresent: number;
  attendancePercentage: number;
}

export interface StudentAlerts {
  topPerformers: StudentAlert[];
  criticalAlerts: StudentAlert[];
}

export interface DayOrderAnalysis {
  dayOrder: number;
  totalDays: number;
  totalStudents: number;
  presentCount: number;
  totalMarked: number;
  attendanceRate: number;
}

export interface DashboardSummary {
  totalStudents: number;
  totalSections: number;
  activeUsers: number;
  totalAttendanceDays: number;
  overallAttendanceAvg: number;
}

export interface PaginatedStudents {
  students: StudentWithAttendance[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    limit: number;
  };
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic request method with error handling
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * GET request helper
   */
  private get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request helper
   */
  private post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request helper
   */
  private put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request helper
   */
  private delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ========================================================================
  // SECTION 1: AUTHENTICATION ENDPOINTS
  // ========================================================================

  async login(username: string, password: string): Promise<LoginResponse> {
    return this.post<LoginResponse>('/auth/login', { username, password });
  }

  async register(username: string, password: string, role: string) {
    return this.post<{ success: boolean; user: User }>('/auth/register', {
      username,
      password,
      role,
    });
  }

  async getUsers(): Promise<UserDetails[]> {
    return this.get<UserDetails[]>('/auth/users');
  }

  async updateUserRole(id: number, role: string): Promise<User> {
    return this.put<User>(`/auth/users/${id}/role`, { role });
  }

  async updateUserStatus(id: number, is_active: boolean) {
    return this.put<{ id: number; username: string; is_active: boolean }>(
      `/auth/users/${id}/status`,
      { is_active }
    );
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/auth/users/${id}`);
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    return this.put<{ success: boolean; message: string }>(
      '/auth/change-password',
      { userId, oldPassword, newPassword }
    );
  }

  // ========================================================================
  // SECTION 2: SECTIONS MANAGEMENT
  // ========================================================================

  async getSections(): Promise<Section[]> {
    return this.get<Section[]>('/sections');
  }

  async getSmartSections(year?: number): Promise<Section[]> {
    const params = year ? `?year=${year}` : '';
    return this.get<Section[]>(`/smartshala/sections${params}`);
  }

  async upsertSection(section_name: string, year: number): Promise<Section> {
    return this.post<Section>('/sections/upsert', { section_name, year });
  }

  async updateSection(
    id: number,
    section_name: string,
    year: number
  ): Promise<Section> {
    return this.put<Section>(`/sections/${id}`, { section_name, year });
  }

  async deleteSection(id: number): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/sections/${id}`);
  }

  // ========================================================================
  // SECTION 3: STUDENTS MANAGEMENT
  // ========================================================================

  // Basic Student Operations
  async getStudents(): Promise<Student[]> {
    return this.get<Student[]>('/students');
  }

  async getStudentsBySection(sectionId: number): Promise<Student[]> {
    return this.get<Student[]>(`/students/section/${sectionId}`);
  }

  async getSmartShaalaStudents(
    section_id?: number,
    year?: number
  ): Promise<Student[]> {
    const params = new URLSearchParams();
    if (section_id) params.append('section_id', section_id.toString());
    if (year) params.append('year', year.toString());
    const queryString = params.toString();
    return this.get<Student[]>(
      `/smartshala/students${queryString ? `?${queryString}` : ''}`
    );
  }

  async addStudent(
    roll_no: string,
    name: string,
    section_id: number,
    year: number
  ): Promise<{ success: boolean; message: string; student: Student }> {
    return this.post<{
      success: boolean;
      message: string;
      student: Student;
    }>('/admin/students', { roll_no, name, section_id, year });
  }

  async bulkAddStudents(students: Student[]): Promise<{
    success: boolean;
    message: string;
    addedCount: number;
    errorCount: number;
    addedStudents: Student[];
    errors: Array<{ roll_no: string; error: string }>;
  }> {
    return this.post<{
      success: boolean;
      message: string;
      addedCount: number;
      errorCount: number;
      addedStudents: Student[];
      errors: Array<{ roll_no: string; error: string }>;
    }>('/admin/students/bulk', { students });
  }

  async insertStudentsBatch(students: any[]): Promise<{ message: string }> {
    return this.post<{ message: string }>('/students/batch', { students });
  }

  // Student Retrieval with Filters
  async getAdminStudents(params: {
    search?: string;
    year?: number;
    section_id?: number;
    section_name?: string;
    attendance_threshold?: number;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: string;
  }): Promise<PaginatedStudents> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    const queryString = queryParams.toString();
    return this.get<PaginatedStudents>(
      `/admin/students${queryString ? `?${queryString}` : ''}`
    );
  }

  async getStudentById(id: number): Promise<StudentProfile> {
    return this.get<StudentProfile>(`/admin/students/${id}`);
  }

  async searchStudents(query: string): Promise<
    Array<{
      id: number;
      roll_no: string;
      name: string;
      year: number;
      section_name: string;
    }>
  > {
    return this.get<
      Array<{
        id: number;
        roll_no: string;
        name: string;
        year: number;
        section_name: string;
      }>
    >(`/admin/students/search?q=${encodeURIComponent(query)}`);
  }

  async getStudentAttendanceCalendar(
    id: number,
    month?: number,
    year?: number
  ): Promise<
    Array<{
      date: string;
      dayOrder: number;
      periods: Record<string, number>;
      markedPeriods: number;
      presentPeriods: number;
      attendanceRate: number;
    }>
  > {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    const queryString = params.toString();
    return this.get<
      Array<{
        date: string;
        dayOrder: number;
        periods: Record<string, number>;
        markedPeriods: number;
        presentPeriods: number;
        attendanceRate: number;
      }>
    >(`/admin/students/${id}/attendance-calendar${queryString ? `?${queryString}` : ''}`);
  }

  // Student Updates
  async updateStudent(
    id: number,
    data: Partial<Student>
  ): Promise<{ success: boolean; message: string; student: Student }> {
    return this.put<{
      success: boolean;
      message: string;
      student: Student;
    }>(`/admin/students/${id}`, data);
  }

  async transferStudent(
    id: number,
    new_section_id: number,
    new_year: number
  ): Promise<{
    success: boolean;
    message: string;
    oldSection: number;
    oldYear: number;
    newSection: number;
    newYear: number;
    student: Student;
  }> {
    return this.put<{
      success: boolean;
      message: string;
      oldSection: number;
      oldYear: number;
      newSection: number;
      newYear: number;
      student: Student;
    }>(`/admin/students/${id}/transfer`, { new_section_id, new_year });
  }

  // Student Deletions
  async deleteStudent(
    id: number,
    hard_delete: boolean = false
  ): Promise<{ success: boolean; message: string }> {
    return this.delete<{ success: boolean; message: string }>(
      `/admin/students/${id}?hard_delete=${hard_delete}`
    );
  }

  async bulkDeleteStudents(student_ids: number[]): Promise<{
    success: boolean;
    message: string;
    deletedCount: number;
  }> {
    return this.post<{
      success: boolean;
      message: string;
      deletedCount: number;
    }>('/admin/students/bulk', { student_ids });
  }

  async deleteStudentsBySection(sectionId: number): Promise<{
    success: boolean;
    message: string;
    deletedCount: number;
  }> {
    return this.delete<{
      success: boolean;
      message: string;
      deletedCount: number;
    }>(`/admin/students/section/${sectionId}`);
  }

  // ========================================================================
  // SECTION 4: ATTENDANCE MARKING ENDPOINTS (NEW)
  // ========================================================================

  /**
   * Mark/Update attendance for a single student
   * Creates new record if doesn't exist, updates if exists
   */
  async markStudentAttendance(
    data: Omit<AttendanceRecord, 'id'>
  ): Promise<{
    success: boolean;
    message: string;
    action: 'created' | 'updated';
    record: AttendanceRecord;
  }> {
    return this.post<{
      success: boolean;
      message: string;
      action: 'created' | 'updated';
      record: AttendanceRecord;
    }>('/admin/attendance/mark-student', data);
  }

  /**
   * Mark attendance for multiple students at once (batch)
   */
  async markBatchAttendance(
    students: BatchAttendanceStudent[],
    date: string,
    day_order: number
  ): Promise<{
    success: boolean;
    message: string;
    results: {
      created: number;
      updated: number;
      errors: Array<{ student_id: number; error: string }>;
    };
  }> {
    return this.post<{
      success: boolean;
      message: string;
      results: {
        created: number;
        updated: number;
        errors: Array<{ student_id: number; error: string }>;
      };
    }>('/admin/attendance/mark-batch', { students, date, day_order });
  }

  /**
   * Update a single period for a student
   */
  async updateAttendancePeriod(
    student_id: number,
    date: string,
    period_number: number,
    status: number
  ): Promise<{
    success: boolean;
    message: string;
    record: AttendanceRecord;
  }> {
    return this.put<{
      success: boolean;
      message: string;
      record: AttendanceRecord;
    }>('/admin/attendance/update-period', {
      student_id,
      date,
      period_number,
      status,
    });
  }

  /**
   * Mark all students present/absent for a specific period
   */
  async markAllStudentsPeriod(
    date: string,
    section_id: number,
    year: number,
    period_number: number,
    status: number,
    day_order: number
  ): Promise<{
    success: boolean;
    message: string;
    updatedCount: number;
    createdCount: number;
    totalStudents: number;
  }> {
    return this.post<{
      success: boolean;
      message: string;
      updatedCount: number;
      createdCount: number;
      totalStudents: number;
    }>('/admin/attendance/mark-all-period', {
      date,
      section_id,
      year,
      period_number,
      status,
      day_order,
    });
  }

  /**
   * Get attendance data for a specific date and section
   * Returns list of students with their attendance status
   */
  async getAttendanceByDateSection(
    date: string,
    section_id: number,
    year: number
  ): Promise<AttendanceByDateSection> {
    const params = new URLSearchParams({
      date,
      section_id: section_id.toString(),
      year: year.toString(),
    });
    return this.get<AttendanceByDateSection>(
      `/admin/attendance/by-date-section?${params.toString()}`
    );
  }

  /**
   * Check if attendance records exist for date/section
   */
  async checkAttendanceExists(
    date: string,
    section_name: string,
    year: number
  ): Promise<{ exists: boolean; recordCount: number }> {
    const params = new URLSearchParams({
      date,
      section_name,
      year: year.toString(),
    });
    return this.get<{ exists: boolean; recordCount: number }>(
      `/admin/attendance/check-exists?${params.toString()}`
    );
  }

  /**
   * Get attendance records with filters
   */
  async getAttendanceRecords(
    date?: string,
    section_name?: string,
    year?: number
  ): Promise<AttendanceRecord[]> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (section_name) params.append('section_name', section_name);
    if (year) params.append('year', year.toString());
    const queryString = params.toString();
    return this.get<AttendanceRecord[]>(
      `/smartshala/attendance${queryString ? `?${queryString}` : ''}`
    );
  }

  /**
   * Insert attendance records (SmartShala endpoint)
   */
  async insertAttendanceRecords(
    records: AttendanceRecord[]
  ): Promise<{ message: string }> {
    return this.post<{ message: string }>('/smartshala/attendance', { records });
  }

  /**
   * Delete attendance record
   */
  async deleteAttendanceRecord(id: number): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/smartshala/attendance/${id}`);
  }

  // ========================================================================
  // SECTION 5: DASHBOARD & ANALYTICS ENDPOINTS
  // ========================================================================

  /**
   * Get all dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    return this.get<DashboardStats>('/admin/dashboard/stats');
  }

  /**
   * Get dashboard summary (quick cards)
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.get<DashboardSummary>('/admin/dashboard/summary');
  }

  /**
   * Get attendance trends for last N days
   */
  async getAttendanceTrends(days: number = 30): Promise<AttendanceTrend[]> {
    return this.get<AttendanceTrend[]>(
      `/admin/dashboard/attendance-trends?days=${days}`
    );
  }

  /**
   * Get section-wise attendance comparison
   */
  async getSectionComparison(params: {
    year?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<SectionComparison[]> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });
    const queryString = queryParams.toString();
    return this.get<SectionComparison[]>(
      `/admin/dashboard/section-comparison${queryString ? `?${queryString}` : ''}`
    );
  }

  /**
   * Get period-wise attendance analysis
   * Shows which periods have most absences
   */
  async getPeriodAnalysis(params: {
    startDate?: string;
    endDate?: string;
  }): Promise<PeriodAnalysis[]> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });
    const queryString = queryParams.toString();
    return this.get<PeriodAnalysis[]>(
      `/admin/dashboard/period-analysis${queryString ? `?${queryString}` : ''}`
    );
  }

  /**
   * Get student alerts (top performers and critical alerts)
   */
  async getStudentAlerts(params: {
    limit?: number;
    threshold?: number;
  }): Promise<StudentAlerts> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.threshold)
      queryParams.append('threshold', params.threshold.toString());
    const queryString = queryParams.toString();
    return this.get<StudentAlerts>(
      `/admin/dashboard/student-alerts${queryString ? `?${queryString}` : ''}`
    );
  }

  /**
   * Get day-order wise attendance pattern
   */
  async getDayOrderAnalysis(params: {
    startDate?: string;
    endDate?: string;
  }): Promise<DayOrderAnalysis[]> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });
    const queryString = queryParams.toString();
    return this.get<DayOrderAnalysis[]>(
      `/admin/dashboard/day-order-analysis${queryString ? `?${queryString}` : ''}`
    );
  }

  // ========================================================================
  // SECTION 6: EXPORT ENDPOINTS
  // ========================================================================

  /**
   * Export single student attendance to Excel
   */
  async exportStudentAttendance(
    student_id: number,
    startDate?: string,
    endDate?: string
  ): Promise<void> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const url = `${this.baseUrl}/admin/attendance/export/student/${student_id}${
      params.toString() ? `?${params.toString()}` : ''
    }`;
    window.open(url, '_blank');
  }

  /**
   * Export all students attendance to Excel
   */
  async exportAllAttendance(year?: number, section_id?: number): Promise<void> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (section_id) params.append('section_id', section_id.toString());
    const url = `${this.baseUrl}/admin/attendance/export/all${
      params.toString() ? `?${params.toString()}` : ''
    }`;
    window.open(url, '_blank');
  }

  // ========================================================================
  // HEALTH CHECK
  // ========================================================================

  /**
   * Check if server is running
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.get<{ status: string; message: string }>('/health');
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const api = new ApiClient(API_BASE_URL);
