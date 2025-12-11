// ============================================================================
// SMARTSHALA ADMIN DASHBOARD - STEP 1: IMPORTS & TYPE DEFINITIONS
// ============================================================================

// ============================================================================
// React & Router Imports
// ============================================================================
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

// ============================================================================
// UI Component Imports (shadcn/ui)
// ============================================================================
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';

// ============================================================================
// Hooks & Utilities
// ============================================================================
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// ============================================================================
// API Types Import
// ============================================================================
import type { 
  DashboardStats, 
  DashboardSummary, 
  AttendanceTrend, 
  SectionComparison,
  PeriodAnalysis,
  StudentAlerts,
  DayOrderAnalysis,
  PaginatedStudents,
  Section,
  Student,
  UserDetails,
  StudentWithAttendance,
  AttendanceRecord,
  StudentProfile,
  BatchAttendanceStudent
} from '@/lib/api';

// ============================================================================
// Icon Imports (Lucide React)
// ============================================================================
import {
  // Navigation Icons
  Home, Menu, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  ArrowLeft, ArrowRight, MoreVertical, MoreHorizontal,
  
  // User & Authentication Icons
  User, Users, UserCheck, UserX, UserPlus, UserCog, LogOut, Lock, Key,
  
  // Dashboard & Analytics Icons
  BarChart3, TrendingUp, TrendingDown, Activity,
  Target, Zap, Award, Trophy, Medal, Star,
  
  // Attendance & Academic Icons
  Calendar, CalendarCheck, CalendarDays, CalendarX, Clock, AlertCircle,
  CheckCircle2, XCircle, AlertTriangle, Info, Bell, BellRing,
  
  // Data Management Icons
  Search, Filter, Download, Upload, FileDown, FileUp, FileText,
  RefreshCw, RotateCw, Plus, Edit, Trash2, Save, Copy,
  
  // UI & Layout Icons
  Eye, EyeOff, Settings, Maximize2, Minimize2, Grid, List,
  Sun, Moon, Palette, Layout, Layers, Package,
  
  // Status & Progress Icons
  Check, Minus, Percent, Hash, DollarSign, BookOpen,
  GraduationCap, School, Building, MapPin,
  
  // Action Icons
  Send, Mail, Phone, MessageSquare, Share2, ExternalLink,
  
  // Miscellaneous
  HelpCircle, ShieldCheck, Database, Server, Wifi,
  ChevronsLeft, 
  ChevronsRight
} from 'lucide-react';

// ============================================================================
// Chart Library Imports (Recharts)
// ============================================================================
import {
  // Chart Components
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, Radar, RadialBarChart, RadialBar,
  ComposedChart, Scatter, ScatterChart,
  
  // Chart Elements
  XAxis, YAxis, CartesianGrid, Legend,
  ResponsiveContainer, Label, LabelList,
  
  // Radar Chart Elements
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  
  // Pie Chart Elements
  Sector
} from 'recharts';

// ============================================================================
// Date Utilities (date-fns)
// ============================================================================
import { 
  format, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  isToday,
  parseISO,
  differenceInDays,
  addDays,
  isSameDay
} from 'date-fns';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Filter state for dashboard data filtering
 */
interface FilterState {
  year: string;
  section: string;
  search: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  attendanceThreshold: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

/**
 * State for editing student attendance
 */
interface AttendanceEditState {
  studentId: number;
  studentName: string;
  studentRollNo: string;
  date: string;
  dayOrder: number;
  periods: {
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

/**
 * State for bulk actions on students
 */
interface BulkActionState {
  selectedStudents: number[];
  action: 'delete' | 'transfer' | 'export' | null;
}

/**
 * Notification item structure
 */
interface NotificationItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

/**
 * Form data for adding a new student
 */
interface AddStudentFormData {
  roll_no: string;
  name: string;
  section_id: string;
  year: string;
}

/**
 * Form data for editing a student
 */
interface EditStudentFormData {
  id: number;
  roll_no: string;
  name: string;
  section_id: string;
  year: string;
}

/**
 * Form data for adding a new section
 */
interface AddSectionFormData {
  section_name: string;
  year: string;
}

/**
 * Form data for bulk student import
 */
interface BulkImportData {
  file: File | null;
  data: any[];
  preview: boolean;
}

/**
 * Dashboard tab types
 */
type DashboardTab = 
  | 'overview'
  | 'attendance'
  | 'students'
  | 'sections'
  | 'users'
  | 'analytics'
  | 'reports';

/**
 * Theme mode
 */
type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Student transfer form data
 */
interface TransferStudentFormData {
  studentId: number;
  studentName: string;
  currentSection: string;
  currentYear: number;
  newSectionId: string;
  newYear: string;
}

/**
 * Attendance marking mode
 */
type AttendanceMarkingMode = 'single' | 'bulk' | 'period';

/**
 * Period attendance data
 */
interface PeriodAttendanceData {
  date: string;
  sectionId: number;
  year: number;
  periodNumber: number;
  dayOrder: number;
}

/**
 * Export options
 */
interface ExportOptions {
  format: 'excel' | 'csv' | 'pdf';
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  filters: {
    year?: string;
    section?: string;
  };
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * Color palette for the dashboard
 */
export const COLORS = {
  primary: 'hsl(217, 91%, 60%)',
  primaryDark: 'hsl(217, 91%, 45%)',
  primaryLight: 'hsl(217, 91%, 75%)',
  
  secondary: 'hsl(271, 76%, 53%)',
  secondaryDark: 'hsl(271, 76%, 38%)',
  secondaryLight: 'hsl(271, 76%, 68%)',
  
  success: 'hsl(142, 76%, 36%)',
  successDark: 'hsl(142, 76%, 26%)',
  successLight: 'hsl(142, 76%, 51%)',
  
  warning: 'hsl(38, 92%, 50%)',
  warningDark: 'hsl(38, 92%, 35%)',
  warningLight: 'hsl(38, 92%, 65%)',
  
  danger: 'hsl(0, 84%, 60%)',
  dangerDark: 'hsl(0, 84%, 45%)',
  dangerLight: 'hsl(0, 84%, 75%)',
  
  info: 'hsl(199, 89%, 48%)',
  infoDark: 'hsl(199, 89%, 33%)',
  infoLight: 'hsl(199, 89%, 63%)',
  
  neutral: 'hsl(220, 13%, 46%)',
  neutralLight: 'hsl(220, 13%, 91%)',
  neutralDark: 'hsl(220, 13%, 18%)',
} as const;

/**
 * Chart color schemes
 */
export const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.info,
] as const;

/**
 * Gradient definitions for visual appeal
 */
export const GRADIENTS = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  warning: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  dark: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
} as const;

/**
 * Attendance status values
 */
export const ATTENDANCE_STATUS = {
  PRESENT: 1,
  ABSENT: 0,
  NOT_MARKED: -1,
} as const;

/**
 * Period labels for display
 */
export const PERIOD_LABELS = [
  'P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'
] as const;

/**
 * Academic years configuration
 */
export const ACADEMIC_YEARS = [
  { value: '1', label: '1st Year', color: COLORS.primary },
  { value: '2', label: '2nd Year', color: COLORS.secondary },
  { value: '3', label: '3rd Year', color: COLORS.success },
  { value: '4', label: '4th Year', color: COLORS.warning },
] as const;

/**
 * Quick actions configuration
 */
export const QUICK_ACTIONS = [
  { 
    id: 'mark-attendance', 
    label: 'Mark Attendance', 
    icon: CheckCircle2, 
    color: 'primary',
    gradient: GRADIENTS.primary,
    description: 'Mark today\'s attendance'
  },
  { 
    id: 'add-student', 
    label: 'Add Student', 
    icon: UserPlus, 
    color: 'success',
    gradient: GRADIENTS.success,
    description: 'Register new student'
  },
  { 
    id: 'bulk-import', 
    label: 'Bulk Import', 
    icon: Upload, 
    color: 'info',
    gradient: GRADIENTS.info,
    description: 'Import from Excel/CSV'
  },
  { 
    id: 'export-reports', 
    label: 'Export Reports', 
    icon: FileDown, 
    color: 'warning',
    gradient: GRADIENTS.warning,
    description: 'Download attendance reports'
  },
] as const;

/**
 * Sidebar navigation items
 */
export const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Overview', icon: Home, color: COLORS.primary },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck, color: COLORS.success },
  { id: 'students', label: 'Students', icon: Users, color: COLORS.secondary },
  { id: 'sections', label: 'Sections', icon: Building, color: COLORS.warning },
  { id: 'users', label: 'Users', icon: UserCog, color: COLORS.info },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: COLORS.danger },
  { id: 'reports', label: 'Reports', icon: FileText, color: COLORS.neutral },
] as const;

/**
 * Sort options for student list
 */
export const SORT_OPTIONS = [
  { value: 'roll_no', label: 'Roll Number' },
  { value: 'name', label: 'Name' },
  { value: 'year', label: 'Year' },
  { value: 'section_name', label: 'Section' },
] as const;

/**
 * Page size options for pagination
 */
export const PAGE_SIZE_OPTIONS = [
  { value: '25', label: '25 per page' },
  { value: '50', label: '50 per page' },
  { value: '100', label: '100 per page' },
  { value: '200', label: '200 per page' },
] as const;

/**
 * User roles configuration
 */
export const USER_ROLES = [
  { value: 'admin', label: 'Administrator', color: COLORS.danger },
  { value: 'teacher', label: 'Teacher', color: COLORS.primary },
  { value: 'staff', label: 'Staff', color: COLORS.secondary },
] as const;

/**
 * Attendance threshold presets
 */
export const ATTENDANCE_THRESHOLDS = [
  { value: '75', label: 'Below 75%', color: COLORS.danger },
  { value: '80', label: 'Below 80%', color: COLORS.warning },
  { value: '85', label: 'Below 85%', color: COLORS.info },
  { value: '90', label: 'Below 90%', color: COLORS.success },
] as const;

/**
 * Date range presets
 */
export const DATE_RANGE_PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'This Month', value: 'month' },
  { label: 'Custom', value: 'custom' },
] as const;

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

/**
 * Breakpoints for responsive design
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// ============================================================================
// END OF STEP 1
// ============================================================================
// ============================================================================
// SMARTSHALA ADMIN DASHBOARD - STEP 2: HELPER FUNCTIONS & BUSINESS LOGIC
// ============================================================================

// NOTE: This file contains all helper functions and business logic.
// Import Step 1 (imports & types) before using these functions.
// Add these to your helper functions section (Step 2)

/**
 * Fetch attendance records for a specific date and section
 */
export const fetchAttendanceForDate = async (
  date: string,
  sectionId: number,
  year: number
) => {
  try {
    return await api.getAttendanceByDateSection(date, sectionId, year);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
};

/**
 * Update single period for a student
 */
export const updateStudentPeriod = async (
  studentId: number,
  date: string,
  periodNumber: number,
  status: number
) => {
  try {
    return await api.updatePeriod(studentId, date, periodNumber, status);
  } catch (error) {
    console.error('Error updating period:', error);
    throw error;
  }
};

/**
 * Mark all students present/absent for a specific period
 */
export const markAllStudentsPeriod = async (
  date: string,
  sectionId: number,
  year: number,
  periodNumber: number,
  status: 0 | 1,
  dayOrder: number
) => {
  try {
    return await api.markAllPeriod(date, sectionId, year, periodNumber, status, dayOrder);
  } catch (error) {
    console.error('Error marking all students:', error);
    throw error;
  }
};

/**
 * Save batch attendance updates
 */
export const saveBatchAttendance = async (
  students: BatchAttendanceStudent[],
  date: string,
  dayOrder: number
) => {
  try {
    return await api.markBatchAttendance(students, date, dayOrder);
  } catch (error) {
    console.error('Error saving batch attendance:', error);
    throw error;
  }
};

/**
 * Get attendance status color for UI
 */
export const getAttendanceStatusColor = (status: number): string => {
  switch (status) {
    case 1: return 'bg-green-500 hover:bg-green-600 text-white';
    case 0: return 'bg-red-500 hover:bg-red-600 text-white';
    default: return 'bg-gray-200 hover:bg-gray-300 text-gray-600';
  }
};

/**
 * Get attendance status icon
 */
export const getAttendanceStatusIconComponent = (status: number) => {
  switch (status) {
    case 1: return CheckCircle2;
    case 0: return XCircle;
    default: return Clock;
  }
};

/**
 * Calculate period statistics for a class
 */
export const calculatePeriodStats = (students: any[], periodNumber: number) => {
  const periodKey = `period_${periodNumber}`;
  const marked = students.filter(s => s.attendance[periodKey] !== -1).length;
  const present = students.filter(s => s.attendance[periodKey] === 1).length;
  const absent = students.filter(s => s.attendance[periodKey] === 0).length;
  
  return { marked, present, absent, total: students.length };
};

/**
 * Validate attendance data before saving
 */
export const validateAttendanceData = (data: any[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (data.length === 0) {
    errors.push('No attendance data to save');
  }
  
  data.forEach((record, index) => {
    if (!record.student_id) errors.push(`Row ${index + 1}: Missing student ID`);
    if (!record.date) errors.push(`Row ${index + 1}: Missing date`);
    if (!record.day_order) errors.push(`Row ${index + 1}: Missing day order`);
  });
  
  return { valid: errors.length === 0, errors };
};

/**
 * Check if attendance can be edited (within allowed timeframe)
 */
export const canEditAttendance = (date: string, allowedDays: number = 7): boolean => {
  const attendanceDate = new Date(date);
  const today = new Date();
  const diffDays = differenceInDays(today, attendanceDate);
  
  return diffDays <= allowedDays && diffDays >= 0;
};

/**
 * Get attendance edit restrictions message
 */
export const getEditRestrictionMessage = (date: string): string | null => {
  const attendanceDate = new Date(date);
  const today = new Date();
  const diffDays = differenceInDays(today, attendanceDate);
  
  if (diffDays < 0) return 'Cannot edit future attendance';
  if (diffDays > 7) return 'Cannot edit attendance older than 7 days';
  return null;
};

// ============================================================================
// AUTHENTICATION & AUTHORIZATION HELPERS
// ============================================================================

/**
 * Get current user from localStorage
 */
export const getCurrentUser = () => {
  return {
    id: parseInt(localStorage.getItem('smartshala_user_id') || '0'),
    username: localStorage.getItem('smartshala_username') || '',
    role: localStorage.getItem('smartshala_role') || '',
  };
};

/**
 * Check if user is authenticated and authorized
 */
export const checkAuth = (navigate: any, toast: any): boolean => {
  const role = localStorage.getItem('smartshala_role');
  
  if (!role) {
    toast({
      title: 'Unauthorized',
      description: 'Please login to continue',
      variant: 'destructive',
    });
    navigate('/smartshala/login');
    return false;
  }
  
  if (role !== 'admin') {
    toast({
      title: 'Access Denied',
      description: 'Admin privileges required',
      variant: 'destructive',
    });
    navigate('/smartshala/login');
    return false;
  }
  
  return true;
};

/**
 * Logout user and clear session
 */
export const handleLogout = (navigate: any, toast: any) => {
  localStorage.removeItem('smartshala_role');
  localStorage.removeItem('smartshala_username');
  localStorage.removeItem('smartshala_user_id');
  localStorage.removeItem('smartshala_login_time');
  
  toast({
    title: 'Logged Out',
    description: 'See you soon! 👋',
  });
  
  navigate('/smartshala/login');
};

// ============================================================================
// ATTENDANCE CALCULATION HELPERS
// ============================================================================

/**
 * Calculate attendance percentage
 */
export const calculateAttendancePercentage = (present: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
};

/**
 * Get attendance color based on percentage
 */
export const getAttendanceColor = (percentage: number): string => {
  if (percentage >= 85) return 'text-green-600 bg-green-50 border-green-200';
  if (percentage >= 75) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

/**
 * Get attendance badge variant
 */
export const getAttendanceBadgeVariant = (percentage: number): 'default' | 'secondary' | 'destructive' => {
  if (percentage >= 85) return 'default';
  if (percentage >= 75) return 'secondary';
  return 'destructive';
};

/**
 * Get attendance status label
 */
export const getAttendanceLabel = (percentage: number): string => {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 85) return 'Very Good';
  if (percentage >= 75) return 'Good';
  if (percentage >= 60) return 'Needs Attention';
  return 'Critical';
};

/**
 * Get period status icon and color
 */
export const getPeriodStatusIcon = (status: number) => {
  switch (status) {
    case 1: // Present
      return { icon: 'CheckCircle2', color: 'text-green-600', bg: 'bg-green-50' };
    case 0: // Absent
      return { icon: 'XCircle', color: 'text-red-600', bg: 'bg-red-50' };
    default: // Not Marked
      return { icon: 'Clock', color: 'text-gray-400', bg: 'bg-gray-50' };
  }
};

/**
 * Calculate total present and absent periods for a day
 */
export const calculateDayAttendance = (periods: Record<string, number>) => {
  const periodValues = Object.values(periods);
  const marked = periodValues.filter(p => p !== -1).length;
  const present = periodValues.filter(p => p === 1).length;
  const absent = periodValues.filter(p => p === 0).length;
  
  return {
    marked,
    present,
    absent,
    percentage: marked > 0 ? calculateAttendancePercentage(present, marked) : 0,
  };
};

// ============================================================================
// DATE & TIME HELPERS
// ============================================================================

/**
 * Format date for display
 */
export const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'dd MMM yyyy');
};

/**
 * Format date for input fields
 */
export const formatDateForInput = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Get today's date formatted
 */
export const getTodayFormatted = (): string => {
  return formatDateForInput(new Date());
};

/**
 * Format time for display
 */
export const formatTime = (date: Date): string => {
  return format(date, 'hh:mm a');
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInDays = differenceInDays(now, date);
  
  if (diffInDays === 0) {
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} min${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) !== 1 ? 's' : ''} ago`;
  
  return formatDate(date);
};

/**
 * Check if date is today
 */
export const isDateToday = (date: string | Date): boolean => {
  return isToday(new Date(date));
};

/**
 * Get date range preset
 */
export const getDateRangePreset = (preset: string): { from: Date; to: Date } => {
  const today = new Date();
  
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case '7days':
      return { from: subDays(today, 7), to: today };
    case '30days':
      return { from: subDays(today, 30), to: today };
    case 'month':
      return { from: startOfMonth(today), to: endOfMonth(today) };
    default:
      return { from: today, to: today };
  }
};

// ============================================================================
// DATA FORMATTING HELPERS
// ============================================================================

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-IN');
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Get initials from name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Generate random color for avatar
 */
export const getRandomColor = (seed: string): string => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-red-500', 'bg-purple-500', 'bg-pink-500',
    'bg-indigo-500', 'bg-cyan-500', 'bg-orange-500'
  ];
  
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate roll number format
 */
export const validateRollNo = (rollNo: string): { valid: boolean; error?: string } => {
  if (!rollNo.trim()) {
    return { valid: false, error: 'Roll number is required' };
  }
  
  if (rollNo.length < 3) {
    return { valid: false, error: 'Roll number too short' };
  }
  
  return { valid: true };
};

/**
 * Validate student name
 */
export const validateName = (name: string): { valid: boolean; error?: string } => {
  if (!name.trim()) {
    return { valid: false, error: 'Name is required' };
  }
  
  if (name.length < 2) {
    return { valid: false, error: 'Name too short' };
  }
  
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return { valid: false, error: 'Name should contain only letters' };
  }
  
  return { valid: true };
};

/**
 * Validate year
 */
export const validateYear = (year: string | number): { valid: boolean; error?: string } => {
  const yearNum = typeof year === 'string' ? parseInt(year) : year;
  
  if (isNaN(yearNum)) {
    return { valid: false, error: 'Invalid year' };
  }
  
  if (yearNum < 1 || yearNum > 4) {
    return { valid: false, error: 'Year must be between 1 and 4' };
  }
  
  return { valid: true };
};

/**
 * Validate form data for adding student
 */
export const validateStudentForm = (data: {
  roll_no: string;
  name: string;
  section_id: string;
  year: string;
}): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  const rollNoValidation = validateRollNo(data.roll_no);
  if (!rollNoValidation.valid) errors.roll_no = rollNoValidation.error!;
  
  const nameValidation = validateName(data.name);
  if (!nameValidation.valid) errors.name = nameValidation.error!;
  
  if (!data.section_id) errors.section_id = 'Section is required';
  
  const yearValidation = validateYear(data.year);
  if (!yearValidation.valid) errors.year = yearValidation.error!;
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

// ============================================================================
// FILTERING & SORTING HELPERS
// ============================================================================

/**
 * Filter students by search query
 */
export const filterStudentsBySearch = (
  students: any[],
  searchQuery: string
): any[] => {
  if (!searchQuery.trim()) return students;
  
  const query = searchQuery.toLowerCase();
  
  return students.filter(student => 
    student.rollNo?.toLowerCase().includes(query) ||
    student.name?.toLowerCase().includes(query) ||
    student.sectionName?.toLowerCase().includes(query)
  );
};

/**
 * Sort students by field
 */
export const sortStudents = (
  students: any[],
  sortBy: string,
  sortOrder: 'ASC' | 'DESC'
): any[] => {
  const sorted = [...students].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle different data types
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortOrder === 'ASC' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'ASC' ? 1 : -1;
    return 0;
  });
  
  return sorted;
};

/**
 * Filter students by attendance threshold
 */
export const filterStudentsByAttendance = (
  students: any[],
  threshold: number
): any[] => {
  if (!threshold) return students;
  
  return students.filter(student => 
    student.attendancePercentage < threshold
  );
};

// ============================================================================
// CHART DATA PREPARATION HELPERS
// ============================================================================

/**
 * Prepare data for attendance trend chart
 */
export const prepareAttendanceTrendData = (trends: any[]) => {
  return trends.map(trend => ({
    date: formatDate(trend.date),
    attendance: trend.attendanceRate,
    students: trend.totalStudents,
  })).reverse(); // Show oldest to newest
};

/**
 * Prepare data for section comparison chart
 */
export const prepareSectionComparisonData = (sections: any[]) => {
  return sections.map(section => ({
    section: section.section,
    attendance: section.attendanceRate,
    students: section.totalStudents,
    fill: COLORS.primary,
  }));
};

/**
 * Prepare data for period analysis chart
 */
export const preparePeriodAnalysisData = (periods: any[]) => {
  return periods.map(period => ({
    period: period.periodName.replace('Period ', 'P'),
    present: period.present,
    absent: period.absent,
    rate: period.attendanceRate,
  }));
};

/**
 * Prepare data for day order analysis
 */
export const prepareDayOrderData = (dayOrders: any[]) => {
  return dayOrders.map(day => ({
    day: `Day ${day.dayOrder}`,
    rate: day.attendanceRate,
    students: day.totalStudents,
  }));
};

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

/**
 * Create notification object
 */
export const createNotification = (
  type: 'success' | 'warning' | 'error' | 'info',
  title: string,
  message: string,
  actionUrl?: string
): NotificationItem => {
  return {
    id: `notif-${Date.now()}-${Math.random()}`,
    type,
    title,
    message,
    timestamp: new Date(),
    read: false,
    actionUrl,
  };
};

/**
 * Get notification icon
 */
export const getNotificationIcon = (type: NotificationItem['type']) => {
  switch (type) {
    case 'success':
      return { icon: 'CheckCircle2', color: 'text-green-600' };
    case 'warning':
      return { icon: 'AlertTriangle', color: 'text-yellow-600' };
    case 'error':
      return { icon: 'XCircle', color: 'text-red-600' };
    case 'info':
      return { icon: 'Info', color: 'text-blue-600' };
  }
};

// ============================================================================
// EXPORT HELPERS
// ============================================================================

/**
 * Download data as JSON file
 */
export const downloadJSON = (data: any, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { 
    type: 'application/json' 
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Download data as CSV file
 */
export const downloadCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============================================================================
// BULK OPERATION HELPERS
// ============================================================================

/**
 * Parse CSV file for bulk import
 */
export const parseCSVFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          reject(new Error('CSV file is empty or invalid'));
          return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index];
          });
          return obj;
        });
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Validate bulk import data
 */
export const validateBulkImportData = (data: any[]): {
  valid: any[];
  invalid: Array<{ row: number; data: any; errors: string[] }>;
} => {
  const valid: any[] = [];
  const invalid: Array<{ row: number; data: any; errors: string[] }> = [];
  
  data.forEach((row, index) => {
    const errors: string[] = [];
    
    if (!row.roll_no?.trim()) errors.push('Roll number is required');
    if (!row.name?.trim()) errors.push('Name is required');
    if (!row.section_id) errors.push('Section ID is required');
    if (!row.year || isNaN(parseInt(row.year))) errors.push('Valid year is required');
    
    if (errors.length > 0) {
      invalid.push({ row: index + 2, data: row, errors }); // +2 for header and 0-index
    } else {
      valid.push(row);
    }
  });
  
  return { valid, invalid };
};

// ============================================================================
// STATISTICS HELPERS
// ============================================================================

/**
 * Calculate statistics summary
 */
export const calculateStatsSummary = (students: any[]) => {
  if (students.length === 0) {
    return {
      total: 0,
      avgAttendance: 0,
      excellent: 0,
      good: 0,
      needsAttention: 0,
    };
  }
  
  const total = students.length;
  const avgAttendance = students.reduce((sum, s) => sum + s.attendancePercentage, 0) / total;
  const excellent = students.filter(s => s.attendancePercentage >= 85).length;
  const good = students.filter(s => s.attendancePercentage >= 75 && s.attendancePercentage < 85).length;
  const needsAttention = students.filter(s => s.attendancePercentage < 75).length;
  
  return {
    total,
    avgAttendance: Math.round(avgAttendance),
    excellent,
    good,
    needsAttention,
  };
};

/**
 * Get year-wise distribution
 */
export const getYearWiseDistribution = (students: any[]) => {
  const distribution = [1, 2, 3, 4].map(year => ({
    year,
    count: students.filter(s => s.year === year).length,
  }));
  
  return distribution;
};

// ============================================================================
// DEBOUNCE HELPER
// ============================================================================

/**
 * Debounce function to limit API calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// ============================================================================
// LOCAL STORAGE HELPERS
// ============================================================================

/**
 * Save user preferences
 */
export const saveUserPreferences = (preferences: any) => {
  localStorage.setItem('smartshala_preferences', JSON.stringify(preferences));
};

/**
 * Load user preferences
 */
export const loadUserPreferences = () => {
  const prefs = localStorage.getItem('smartshala_preferences');
  return prefs ? JSON.parse(prefs) : null;
};

/**
 * Save filter state
 */
export const saveFilterState = (filters: any) => {
  localStorage.setItem('smartshala_filters', JSON.stringify(filters));
};

/**
 * Load filter state
 */
export const loadFilterState = () => {
  const filters = localStorage.getItem('smartshala_filters');
  return filters ? JSON.parse(filters) : null;
};

// ============================================================================
// END OF STEP 2
// ============================================================================
// ============================================================================
// SMARTSHALA ADMIN DASHBOARD - MAIN COMPONENT
// ============================================================================
// NOTE: This uses all imports and helpers from Step 1 & Step 2
// Make sure to include those files in your project
// ============================================================================

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // Core// Add these to your state management section (around line 470)

// Attendance Editing States
const [attendanceEditMode, setAttendanceEditMode] = useState<'view' | 'edit'>('view');
const [selectedDate, setSelectedDate] = useState<string>(getTodayFormatted());
const [selectedDayOrder, setSelectedDayOrder] = useState<number>(1);
const [attendanceData, setAttendanceData] = useState<StudentWithAttendance[]>([]);
const [loadingAttendance, setLoadingAttendance] = useState(false);
const [editingRecords, setEditingRecords] = useState<Map<number, any>>(new Map());
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

// Quick Actions States
const [markingAllPeriod, setMarkingAllPeriod] = useState<number | null>(null);
const [quickMarkStatus, setQuickMarkStatus] = useState<0 | 1 | null>(null);

// Bulk Edit States
const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
const [bulkEditPeriod, setBulkEditPeriod] = useState<number | null>(null); 
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<AttendanceTrend[]>([]);
  const [sectionComparison, setSectionComparison] = useState<SectionComparison[]>([]);
  const [periodAnalysis, setPeriodAnalysis] = useState<PeriodAnalysis[]>([]);
  const [studentAlerts, setStudentAlerts] = useState<StudentAlerts | null>(null);
  const [dayOrderAnalysis, setDayOrderAnalysis] = useState<DayOrderAnalysis[]>([]);
  const [students, setStudents] = useState<PaginatedStudents | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [users, setUsers] = useState<UserDetails[]>([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [attendanceThreshold, setAttendanceThreshold] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

  // Dialog States
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [editStudentOpen, setEditStudentOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [addSectionOpen, setAddSectionOpen] = useState(false);

  // Form States
  const [newStudent, setNewStudent] = useState<AddStudentFormData>({ roll_no: '', name: '', section_id: '', year: '' });
  const [editingStudent, setEditingStudent] = useState<EditStudentFormData | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<number | null>(null);
  const [newSection, setNewSection] = useState<AddSectionFormData>({ section_name: '', year: '' });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Selected Student for Details
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);

  // ============================================================================
  // AUTH & USER INFO
  // ============================================================================
  
  const currentUser = useMemo(() => getCurrentUser(), []);

  useEffect(() => {
    if (!checkAuth(navigate, toast)) return;
  }, [navigate, toast]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, summaryData, trendsData, alertsData, studentsData, sectionsData] = await Promise.all([
        api.getDashboardStats(),
        api.getDashboardSummary(),
        api.getAttendanceTrends(30),
        api.getStudentAlerts({ limit: 10, threshold: 75 }),
        api.getAdminStudents({ 
          page: currentPage, 
          limit: pageSize,
          year: selectedYear ? parseInt(selectedYear) : undefined,
          section_id: selectedSection ? parseInt(selectedSection) : undefined,
          search: searchQuery,
        }),
        api.getSections(),
      ]);

      setStats(statsData);
      setSummary(summaryData);
      setTrends(trendsData);
      setStudentAlerts(alertsData);
      setStudents(studentsData);
      setSections(sectionsData);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, selectedYear, selectedSection, searchQuery, toast]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const [sectionComp, periodAnal, dayOrderAnal] = await Promise.all([
        api.getSectionComparison({ year: selectedYear ? parseInt(selectedYear) : undefined }),
        api.getPeriodAnalysis({}),
        api.getDayOrderAnalysis({}),
      ]);
      setSectionComparison(sectionComp);
      setPeriodAnalysis(periodAnal);
      setDayOrderAnalysis(dayOrderAnal);
    } catch (error) {
      console.error('Analytics fetch error:', error);
    }
  }, [selectedYear]);

  const fetchUsers = useCallback(async () => {
    try {
      const usersData = await api.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Users fetch error:', error);
    }
  }, []);

  const fetchStudentProfile = useCallback(async (studentId: number) => {
    try {
      const profile = await api.getStudentById(studentId);
      setStudentProfile(profile);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
    fetchAnalytics();
    fetchUsers();
  }, [fetchDashboardData, fetchAnalytics, fetchUsers]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  // Add these to your event handlers section

/**
 * Fetch and load attendance data for editing
 */
const handleLoadAttendance = useCallback(async () => {
  if (!selectedSection || !selectedYear) {
    toast({
      title: 'Selection Required',
      description: 'Please select a section and year',
      variant: 'destructive',
    });
    return;
  }

  setLoadingAttendance(true);
  try {
    const data = await api.getAttendanceByDateSection(
      selectedDate,
      parseInt(selectedSection),
      parseInt(selectedYear)
    );
    setAttendanceData(data.students);
    setEditingRecords(new Map());
    setHasUnsavedChanges(false);
  } catch (error: any) {
    toast({
      title: 'Error',
      description: error.message || 'Failed to load attendance',
      variant: 'destructive',
    });
  } finally {
    setLoadingAttendance(false);
  }
}, [selectedDate, selectedSection, selectedYear, toast]);

/**
 * Handle period toggle for single student
 */
const handlePeriodToggle = useCallback((studentId: number, periodNumber: number) => {
  setAttendanceData(prev => prev.map(student => {
    if (student.id === studentId) {
      const periodKey = `period_${periodNumber}` as keyof typeof student.attendance;
      const currentStatus = student.attendance[periodKey];
      
      // Cycle through: -1 -> 1 -> 0 -> 1 -> ...
      let newStatus: number;
      if (currentStatus === -1) newStatus = 1;
      else if (currentStatus === 1) newStatus = 0;
      else newStatus = 1;
      
      // Track changes
      const updated = {
        ...student,
        attendance: {
          ...student.attendance,
          [periodKey]: newStatus,
        },
      };
      
      setEditingRecords(prev => {
        const newMap = new Map(prev);
        newMap.set(studentId, updated);
        return newMap;
      });
      
      setHasUnsavedChanges(true);
      return updated;
    }
    return student;
  }));
}, []);

/**
 * Handle marking all students for a specific period
 */
const handleMarkAllPeriod = useCallback(async (periodNumber: number, status: 0 | 1) => {
  if (!selectedSection || !selectedYear) return;

  try {
    await api.markAllPeriod(
      selectedDate,
      parseInt(selectedSection),
      parseInt(selectedYear),
      periodNumber,
      status,
      selectedDayOrder
    );
    
    toast({
      title: 'Success',
      description: `Period ${periodNumber} marked ${status === 1 ? 'present' : 'absent'} for all students`,
    });
    
    handleLoadAttendance();
  } catch (error: any) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    });
  }
}, [selectedDate, selectedSection, selectedYear, selectedDayOrder, handleLoadAttendance, toast]);

/**
 * Save all attendance changes
 */
const handleSaveAttendance = useCallback(async () => {
  if (editingRecords.size === 0) {
    toast({
      title: 'No Changes',
      description: 'No attendance changes to save',
    });
    return;
  }

  try {
    const updates = Array.from(editingRecords.values()).map(student => ({
      student_id: student.id,
      year: student.year,
      section_name: student.sectionName,
      period_0: student.attendance.period_0,
      period_1: student.attendance.period_1,
      period_2: student.attendance.period_2,
      period_3: student.attendance.period_3,
      period_4: student.attendance.period_4,
      period_5: student.attendance.period_5,
      period_6: student.attendance.period_6,
      period_7: student.attendance.period_7,
    }));

    await api.markBatchAttendance(updates, selectedDate, selectedDayOrder);
    
    toast({
      title: 'Success',
      description: `Saved attendance for ${updates.length} students`,
    });
    
    setEditingRecords(new Map());
    setHasUnsavedChanges(false);
    handleLoadAttendance();
  } catch (error: any) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    });
  }
}, [editingRecords, selectedDate, selectedDayOrder, handleLoadAttendance, toast]);

/**
 * Discard unsaved changes
 */
const handleDiscardChanges = useCallback(() => {
  setEditingRecords(new Map());
  setHasUnsavedChanges(false);
  handleLoadAttendance();
  toast({
    title: 'Changes Discarded',
    description: 'All unsaved changes have been reverted',
  });
}, [handleLoadAttendance, toast]);

/**
 * Handle bulk selection toggle
 */
const handleSelectStudent = useCallback((studentId: number) => {
  setSelectedStudents(prev => {
    const newSet = new Set(prev);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    return newSet;
  });
}, []);

/**
 * Handle select all toggle
 */
const handleSelectAll = useCallback(() => {
  if (selectedStudents.size === attendanceData.length) {
    setSelectedStudents(new Set());
  } else {
    setSelectedStudents(new Set(attendanceData.map(s => s.id)));
  }
}, [attendanceData, selectedStudents]);

/**
 * Handle bulk period update
 */
const handleBulkPeriodUpdate = useCallback((periodNumber: number, status: 0 | 1) => {
  if (selectedStudents.size === 0) {
    toast({
      title: 'No Selection',
      description: 'Please select students first',
      variant: 'destructive',
    });
    return;
  }

  setAttendanceData(prev => prev.map(student => {
    if (selectedStudents.has(student.id)) {
      const periodKey = `period_${periodNumber}` as keyof typeof student.attendance;
      const updated = {
        ...student,
        attendance: {
          ...student.attendance,
          [periodKey]: status,
        },
      };
      
      setEditingRecords(prev => {
        const newMap = new Map(prev);
        newMap.set(student.id, updated);
        return newMap;
      });
      
      return updated;
    }
    return student;
  }));
  
  setHasUnsavedChanges(true);
  toast({
    title: 'Bulk Update',
    description: `Updated period ${periodNumber} for ${selectedStudents.size} students`,
  });
}, [selectedStudents, toast]);
// ```

// ---

// ## 🎨 **Recommended UI Structure for Attendance Tab**

// I'll create a **completely NEW Attendance tab** with rich editing features. Here's what it should include:

// ### **Layout Structure:*
// ┌─────────────────────────────────────────────────────────┐
// │  🎯 ATTENDANCE EDITOR                                   │
// ├─────────────────────────────────────────────────────────┤
// │  📅 Date Picker  |  🏫 Section  |  📊 Year  | 🔢 Day   │
// │  [Save] [Discard] [Quick Actions ▼] [Analytics]        │
// ├─────────────────────────────────────────────────────────┤
// │  Statistics: Present: 45 | Absent: 5 | Not Marked: 0   │
// ├─────────────────────────────────────────────────────────┤
// │  ┌──────────────────────────────────────────────────┐  │
// │  │ [√] Student List with Period Grid (P0-P7)        │  │
// │  │ ☑️ Roll  Name    [P0][P1][P2][P3][P4][P5][P6][P7]│  │
// │  │ ☑️ 001   John    [✓] [✓] [✗] [✓] [✓] [○] [✓] [✓]│  │
// │  │ ☐ 002   Jane    [✓] [✓] [✓] [✓] [✓] [✓] [✓] [✓]│  │
// │  └──────────────────────────────────────────────────┘  │
// └─────────────────────────────────────────────────────────┘
 

const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboardData(), fetchAnalytics(), fetchUsers()]);
    setRefreshing(false);
    toast({ title: 'Refreshed', description: 'Data updated successfully' });
  };

  const handleLogoutClick = () => {
    handleLogout(navigate, toast);
  };

  const handleAddStudent = async () => {
    const validation = validateStudentForm(newStudent);
    if (!validation.valid) {
      Object.values(validation.errors).forEach(error => {
        toast({ title: 'Validation Error', description: error, variant: 'destructive' });
      });
      return;
    }

    try {
      await api.addStudent(
        newStudent.roll_no,
        newStudent.name,
        parseInt(newStudent.section_id),
        parseInt(newStudent.year)
      );
      toast({ title: 'Success', description: 'Student added successfully' });
      setAddStudentOpen(false);
      setNewStudent({ roll_no: '', name: '', section_id: '', year: '' });
      fetchDashboardData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleEditStudent = async () => {
    if (!editingStudent) return;

    try {
      await api.updateStudent(editingStudent.id, {
        roll_no: editingStudent.roll_no,
        name: editingStudent.name,
        section_id: parseInt(editingStudent.section_id),
        year: parseInt(editingStudent.year),
      });
      toast({ title: 'Success', description: 'Student updated successfully' });
      setEditStudentOpen(false);
      setEditingStudent(null);
      fetchDashboardData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteStudent = async () => {
    if (!deletingStudentId) return;

    try {
      await api.deleteStudent(deletingStudentId, false);
      toast({ title: 'Success', description: 'Student deleted successfully' });
      setDeleteConfirmOpen(false);
      setDeletingStudentId(null);
      fetchDashboardData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddSection = async () => {
    if (!newSection.section_name || !newSection.year) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' });
      return;
    }

    try {
      await api.upsertSection(newSection.section_name, parseInt(newSection.year));
      toast({ title: 'Success', description: 'Section added successfully' });
      setAddSectionOpen(false);
      setNewSection({ section_name: '', year: '' });
      fetchDashboardData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleExportAll = () => {
    api.exportAllAttendance(
      selectedYear ? parseInt(selectedYear) : undefined,
      selectedSection ? parseInt(selectedSection) : undefined
    );
    toast({ title: 'Export Started', description: 'Download will begin shortly' });
    setExportDialogOpen(false);
  };

  const handleExportStudent = (studentId: number) => {
    api.exportStudentAttendance(studentId);
    toast({ title: 'Export Started', description: 'Student report downloading' });
  };

  const handleViewStudent = (studentId: number) => {
    setSelectedStudentId(studentId);
    fetchStudentProfile(studentId);
  };

  const openEditDialog = (student: any) => {
    setEditingStudent({
      id: student.id,
      roll_no: student.roll_no,
      name: student.name,
      section_id: student.section_id.toString(),
      year: student.year.toString(),
    });
    setEditStudentOpen(true);
  };

  const openDeleteDialog = (studentId: number) => {
    setDeletingStudentId(studentId);
    setDeleteConfirmOpen(true);
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const chartData = useMemo(() => ({
    trends: prepareAttendanceTrendData(trends),
    sections: prepareSectionComparisonData(sectionComparison),
    periods: preparePeriodAnalysisData(periodAnalysis),
    dayOrders: prepareDayOrderData(dayOrderAnalysis),
  }), [trends, sectionComparison, periodAnalysis, dayOrderAnalysis]);

  const filteredStudents = useMemo(() => {
    if (!students?.students) return [];
    let filtered = students.students;
    
    if (searchQuery) {
      filtered = filterStudentsBySearch(filtered, searchQuery);
    }
    
    if (attendanceThreshold) {
      filtered = filterStudentsByAttendance(filtered, parseFloat(attendanceThreshold));
    }
    
    return filtered;
  }, [students, searchQuery, attendanceThreshold]);

  const statsCards = useMemo(() => [
    {
      title: 'Total Students',
      value: formatNumber(summary?.totalStudents || 0),
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      description: 'Across all sections',
    },
    {
      title: 'Total Sections',
      value: formatNumber(summary?.totalSections || 0),
      icon: Building,
      gradient: 'from-purple-500 to-purple-600',
      description: 'Active sections',
    },
    {
      title: 'Avg Attendance',
      value: formatPercentage(summary?.overallAttendanceAvg || 0),
      icon: TrendingUp,
      gradient: 'from-green-500 to-green-600',
      description: 'Overall average',
    },
    {
      title: 'Low Attendance',
      value: formatNumber(stats?.lowAttendanceCount || 0),
      icon: AlertCircle,
      gradient: 'from-orange-500 to-orange-600',
      description: 'Students below 75%',
    },
  ], [summary, stats]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-t-4 border-blue-600 mx-auto"></div>
            <div className="animate-ping absolute inset-0 rounded-full h-20 w-20 border-4 border-purple-400 opacity-20"></div>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Loading Dashboard
            </p>
            <p className="text-sm text-gray-600">Fetching your data...</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* ========== HEADER ========== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-lg border-b-4 border-gradient-to-r from-blue-500 to-purple-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SmartShala Admin
                </h1>
                <p className="text-sm text-gray-600">Welcome back, {currentUser.username}</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                      <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh Data</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button variant="outline" size="sm" onClick={handleLogoutClick}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ========== MAIN CONTENT ========== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          
          {/* ========== TAB NAVIGATION ========== */}
          <TabsList className="grid grid-cols-4 lg:grid-cols-7 gap-2 bg-white p-2 rounded-xl shadow-lg">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">
              <CalendarCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Students</span>
            </TabsTrigger>
            <TabsTrigger value="sections" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Sections</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              <UserCog className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          {/* ========================================================================== */}
          {/* TAB: OVERVIEW */}
          {/* ========================================================================== */}
          <TabsContent value="overview" className="space-y-6">
            
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((card, index) => (
                <Card 
                  key={index}
                  className={cn(
                    "bg-gradient-to-br text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 cursor-pointer",
                    card.gradient
                  )}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 opacity-90">
                      <card.icon className="h-5 w-5" />
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">{card.value}</div>
                    <p className="text-xs opacity-80">{card.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="shadow-xl border-2 border-purple-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common tasks and operations</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {QUICK_ACTIONS.map(action => (
                    <Button
                      key={action.id}
                      onClick={() => {
                        if (action.id === 'mark-attendance') setActiveTab('attendance');
                        else if (action.id === 'add-student') setAddStudentOpen(true);
                        else if (action.id === 'bulk-import') setBulkImportOpen(true);
                        else if (action.id === 'export-reports') setExportDialogOpen(true);
                      }}
                      className="h-32 flex flex-col gap-3 bg-gradient-to-br hover:scale-105 transition-transform shadow-lg text-white"
                      style={{ background: action.gradient }}
                    >
                      <action.icon className="h-10 w-10" />
                      <div className="text-center">
                        <div className="font-semibold">{action.label}</div>
                        <div className="text-xs opacity-80 mt-1">{action.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Attendance Trend Chart */}
              <Card className="shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-blue-600" />
                    Attendance Trend (Last 30 Days)
                  </CardTitle>
                  <CardDescription>Daily attendance percentage overview</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData.trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#6b7280" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" domain={[0, 100]} />
                      <Tooltip 
                        
                      />
                      <Line 
                        type="monotone" 
                        dataKey="attendance" 
                        stroke={COLORS.primary} 
                        strokeWidth={3}
                        dot={{ fill: COLORS.primary, r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Attendance %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Year-wise Distribution */}
              <Card className="shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-600" />
                    Students by Year
                  </CardTitle>
                  <CardDescription>Distribution across academic years</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={stats?.studentsByYear || []}
                        dataKey="count"
                        nameKey="year"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={(entry) => `Year ${entry.year}: ${entry.count}`}
                      >
                        {(stats?.studentsByYear || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

            </div>

            {/* Critical Alerts Section */}
            {studentAlerts && studentAlerts.criticalAlerts.length > 0 && (
              <Card className="shadow-xl border-l-4 border-red-500">
                <CardHeader className="bg-red-50">
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Critical Attendance Alerts
                  </CardTitle>
                  <CardDescription className="text-red-700">
                    {studentAlerts.criticalAlerts.length} students need immediate attention
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ScrollArea className="h-80">
                    <div className="space-y-3">
                      {studentAlerts.criticalAlerts.map(student => (
                        <div 
                          key={student.id} 
                          className="flex items-center justify-between p-4 bg-red-50 rounded-lg border-2 border-red-200 hover:border-red-300 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className={getRandomColor(student.name)}>
                                {getInitials(student.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-600">{student.rollNo} • {student.sectionName} • Year {student.year}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Present: {student.present}/{student.total} days
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="destructive" className="text-lg px-4 py-2 mb-2">
                              {formatPercentage(student.attendancePercentage)}
                            </Badge>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleViewStudent(student.id)}>
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button size="sm" onClick={() => handleExportStudent(student.id)}>
                                <Download className="h-3 w-3 mr-1" />
                                Export
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Top Performers */}
            {studentAlerts && studentAlerts.topPerformers.length > 0 && (
              <Card className="shadow-xl border-l-4 border-green-500">
                <CardHeader className="bg-green-50">
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <Award className="h-5 w-5" />
                    Top Performers
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Students with excellent attendance (≥95%)
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {studentAlerts.topPerformers.slice(0, 6).map(student => (
                      <div 
                        key={student.id}
                        className="p-4 bg-green-50 rounded-lg border-2 border-green-200 hover:border-green-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar>
                            <AvatarFallback className="bg-green-500 text-white">
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{student.name}</p>
                            <p className="text-xs text-gray-600">{student.rollNo}</p>
                          </div>
                          <Trophy className="h-6 w-6 text-yellow-500" />
                        </div>
                        <Badge variant="default" className="w-full justify-center bg-green-600">
                          {formatPercentage(student.attendancePercentage)}
                        </Badge>
                      </div>
                    ))}

                    </div>
                </CardContent>
              </Card>
            )}

          </TabsContent>

          {/* ========================================================================== */}
          {/* TAB: ATTENDANCE */}
          {/* ========================================================================== */}
          <TabsContent value="attendance" className="space-y-6">
            
            {/* Filters Section */}
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-green-600" />
                  Filter Attendance Records
                </CardTitle>
                <CardDescription>Search and filter attendance data</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Years</SelectItem>
                      {ACADEMIC_YEARS.map(year => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Sections</SelectItem>
                      {sections.map(section => (
                        <SelectItem key={section.id} value={section.id.toString()}>
                          {section.section_name} (Year {section.year})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={attendanceThreshold} onValueChange={setAttendanceThreshold}>
                    <SelectTrigger>
                      <SelectValue placeholder="Attendance Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Students</SelectItem>
                      {ATTENDANCE_THRESHOLDS.map(threshold => (
                        <SelectItem key={threshold.value} value={threshold.value}>
                          {threshold.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button 
                    onClick={() => {
                      setSelectedYear('');
                      setSelectedSection('');
                      setAttendanceThreshold('');
                      setSearchQuery('');
                    }}
                    variant="outline"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Period Analysis Chart */}
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-cyan-600" />
                  Period-wise Attendance Analysis
                </CardTitle>
                <CardDescription>Attendance distribution across periods</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={chartData.periods}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <Tooltip 
                      
                    />
                    <Legend />
                    <Bar dataKey="present" fill={COLORS.success} name="Present" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="absent" fill={COLORS.danger} name="Absent" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Day Order Analysis */}
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Day Order Attendance Pattern
                </CardTitle>
                <CardDescription>Attendance rates by day order</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.dayOrders}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" domain={[0, 100]} />
                    <Tooltip 
                      
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke={COLORS.secondary} 
                      strokeWidth={3}
                      dot={{ fill: COLORS.secondary, r: 5 }}
                      name="Attendance %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </TabsContent>

          {/* ========================================================================== */}
          {/* TAB: STUDENTS */}
          {/* ========================================================================== */}
          {/* ========================================================================== */}
          {/* TAB: STUDENTS - FULLY CORRECTED */}
          {/* ========================================================================== */}
          <TabsContent value="students" className="space-y-6">
            
            {/* Search & Actions Bar */}
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      Student Management
                    </CardTitle>
                    <CardDescription>
                      Showing {filteredStudents.length} of {students?.pagination?.totalRecords || 0} students
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setAddStudentOpen(true)} className="bg-gradient-to-r from-green-500 to-emerald-500">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Student
                    </Button>
                    <Button onClick={() => setBulkImportOpen(true)} variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Bulk Import
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name or roll number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Years</SelectItem>
                      {ACADEMIC_YEARS.map(year => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Sections</SelectItem>
                      {sections.map(section => (
                        <SelectItem key={section.id} value={section.id.toString()}>
                          {section.section_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={attendanceThreshold} onValueChange={setAttendanceThreshold}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Attendance Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Students</SelectItem>
                      {ATTENDANCE_THRESHOLDS.map(threshold => (
                        <SelectItem key={threshold.value} value={threshold.value}>
                          {threshold.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Students</p>
                      <p className="text-3xl font-bold text-blue-700">
                        {formatNumber(students?.pagination?.totalRecords || 0)}
                      </p>
                    </div>
                    <Users className="h-12 w-12 text-blue-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Excellent (≥85%)</p>
                      <p className="text-3xl font-bold text-green-700">
                        {formatNumber(filteredStudents.filter(s => s.attendancePercentage >= 85).length)}
                      </p>
                    </div>
                    <CheckCircle2 className="h-12 w-12 text-green-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600 font-medium">Good (75-84%)</p>
                      <p className="text-3xl font-bold text-yellow-700">
                        {formatNumber(filteredStudents.filter(s => s.attendancePercentage >= 75 && s.attendancePercentage < 85).length)}
                      </p>
                    </div>
                    <AlertCircle className="h-12 w-12 text-yellow-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-medium">Critical (&lt;75%)</p>
                      <p className="text-3xl font-bold text-red-700">
                        {formatNumber(filteredStudents.filter(s => s.attendancePercentage < 75).length)}
                      </p>
                    </div>
                    <XCircle className="h-12 w-12 text-red-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Students Table */}
            <Card className="shadow-xl">
              <CardContent className="pt-6">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Students Found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchQuery || selectedYear || selectedSection || attendanceThreshold
                        ? 'Try adjusting your filters'
                        : 'Add your first student to get started'}
                    </p>
                    <Button onClick={() => setAddStudentOpen(true)} className="bg-gradient-to-r from-purple-500 to-pink-500">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add First Student
                    </Button>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="h-[600px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Avatar</TableHead>
                            <TableHead>Roll No</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Section</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Attendance</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents.map((student) => (
                            <TableRow key={student.id} className="hover:bg-gray-50">
                              <TableCell>
                                <Avatar>
                                  <AvatarFallback className={getRandomColor(student.name)}>
                                    {getInitials(student.name)}
                                  </AvatarFallback>
                                </Avatar>
                              </TableCell>
                              <TableCell className="font-mono font-semibold">
                                {student.roll_no}
                              </TableCell>
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-normal">
                                  {student.sectionName}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline"
                                  className={cn(
                                    "font-semibold",
                                    student.year === 1 ? "border-blue-500 text-blue-600" :
                                    student.year === 2 ? "border-purple-500 text-purple-600" :
                                    student.year === 3 ? "border-green-500 text-green-600" :
                                    "border-orange-500 text-orange-600"
                                  )}
                                >
                                  Year {student.year}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold">
                                      {formatPercentage(student.attendancePercentage)}
                                    </span>
                                  </div>
                                  <Progress 
                                    value={student.attendancePercentage} 
                                    className={cn(
                                      "h-2",
                                      student.attendancePercentage >= 85 ? "[&>div]:bg-green-500" :
                                      student.attendancePercentage >= 75 ? "[&>div]:bg-yellow-500" :
                                      "[&>div]:bg-red-500"
                                    )}
                                  />
                                  <p className="text-xs text-gray-600">
                                    {student.presentCount}/{student.totalMarked} periods
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={getAttendanceBadgeVariant(student.attendancePercentage)}
                                  className="whitespace-nowrap"
                                >
                                  {getAttendanceLabel(student.attendancePercentage)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleViewStudent(student.id)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openEditDialog(student)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Student
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExportStudent(student.id)}>
                                      <Download className="h-4 w-4 mr-2" />
                                      Export Report
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => openDeleteDialog(student.id)}
                                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Student
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between mt-6 pt-6 border-t">
                      <div className="text-sm text-gray-600">
                        Page {students?.pagination?.currentPage || 1} of {students?.pagination?.totalPages || 1}
                        <span className="ml-2 text-gray-500">
                          ({formatNumber(students?.pagination?.totalRecords || 0)} total records)
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, students?.pagination?.totalPages || 1) }, (_, i) => {
                            const totalPages = students?.pagination?.totalPages || 1;
                            let pageNum;
                            
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-10"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === (students?.pagination?.totalPages || 1)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(students?.pagination?.totalPages || 1)}
                          disabled={currentPage === (students?.pagination?.totalPages || 1)}
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Select 
                        value={pageSize.toString()} 
                        onValueChange={(v) => {
                          setPageSize(parseInt(v));
                          setCurrentPage(1); // Reset to first page when changing page size
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAGE_SIZE_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Bulk Actions Card (Optional Enhancement) */}
            {filteredStudents.length > 0 && (
              <Card className="shadow-xl border-2 border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <Zap className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Perform actions on multiple students</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col gap-2"
                      onClick={() => {
                        api.exportAllAttendance(
                          selectedYear ? parseInt(selectedYear) : undefined,
                          selectedSection ? parseInt(selectedSection) : undefined
                        );
                        toast({ title: 'Export Started', description: 'Downloading filtered students data' });
                      }}
                    >
                      <Download className="h-6 w-6 text-blue-600" />
                      <span className="text-sm">Export All</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col gap-2"
                      onClick={() => setBulkImportOpen(true)}
                    >
                      <Upload className="h-6 w-6 text-green-600" />
                      <span className="text-sm">Bulk Import</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col gap-2"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedYear('');
                        setSelectedSection('');
                        setAttendanceThreshold('');
                        setCurrentPage(1);
                        toast({ title: 'Filters Cleared', description: 'Showing all students' });
                      }}
                    >
                      <RefreshCw className="h-6 w-6 text-purple-600" />
                      <span className="text-sm">Clear Filters</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col gap-2"
                      onClick={() => setAddStudentOpen(true)}
                    >
                      <UserPlus className="h-6 w-6 text-cyan-600" />
                      <span className="text-sm">Add Student</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          </TabsContent>
          

          {/* ========================================================================== */}
          {/* TAB: SECTIONS */}
          {/* ========================================================================== */}
          <TabsContent value="sections" className="space-y-6">
            
            {/* Section Management Header */}
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-orange-600" />
                      Section Management
                    </CardTitle>
                    <CardDescription>Manage academic sections and their configurations</CardDescription>
                  </div>
                  <Button onClick={() => setAddSectionOpen(true)} className="bg-gradient-to-r from-orange-500 to-red-500">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map(section => {
                const sectionStats = students?.students.filter(s => s.section_id === section.id) || [];
                const avgAttendance = sectionStats.length > 0
                  ? sectionStats.reduce((sum, s) => sum + s.attendancePercentage, 0) / sectionStats.length
                  : 0;

                return (
                  <Card key={section.id} className="shadow-xl hover:shadow-2xl transition-shadow">
                    <CardHeader className={cn(
                      "bg-gradient-to-br text-white",
                      section.year === 1 ? "from-blue-500 to-blue-600" :
                      section.year === 2 ? "from-purple-500 to-purple-600" :
                      section.year === 3 ? "from-green-500 to-green-600" :
                      "from-orange-500 to-orange-600"
                    )}>
                      <CardTitle className="flex items-center justify-between">
                        <span>{section.section_name}</span>
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          Year {section.year}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <Users className="h-5 w-5 mx-auto mb-2 text-blue-600" />
                          <div className="text-2xl font-bold text-blue-600">{sectionStats.length}</div>
                          <div className="text-xs text-gray-600">Students</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <TrendingUp className="h-5 w-5 mx-auto mb-2 text-green-600" />
                          <div className="text-2xl font-bold text-green-600">
                            {formatPercentage(avgAttendance, 1)}
                          </div>
                          <div className="text-xs text-gray-600">Avg Attendance</div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedSection(section.id.toString());
                            setActiveTab('students');
                          }}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          View Students
                        </Button>
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Section Comparison Chart */}
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  Section-wise Attendance Comparison
                </CardTitle>
                <CardDescription>Compare attendance rates across sections</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={chartData.sections}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="section" tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" domain={[0, 100]} />
                    <Tooltip 
                      
                    />
                    <Bar 
                      dataKey="attendance" 
                      fill={COLORS.warning} 
                      name="Attendance %"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </TabsContent>

          {/* ========================================================================== */}
          {/* TAB: USERS */}
          {/* ========================================================================== */}
          <TabsContent value="users" className="space-y-6">
            
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-indigo-600" />
                  User Management
                </CardTitle>
                <CardDescription>Manage system users and their permissions</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Avatar</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Avatar>
                              <AvatarFallback className={getRandomColor(user.username)}>
                                {getInitials(user.username)}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={cn(
                                user.role === 'admin' ? 'border-red-500 text-red-600' :
                                user.role === 'teacher' ? 'border-blue-500 text-blue-600' :
                                'border-purple-500 text-purple-600'
                              )}
                            >
                              {user.role.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-500">Active</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {user.last_login ? formatDate(user.last_login) : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

          </TabsContent>

          {/* ========================================================================== */}
          {/* TAB: ANALYTICS */}
          {/* ========================================================================== */}
          <TabsContent value="analytics" className="space-y-6">
            
            <Alert className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
              <BarChart3 className="h-4 w-4 text-cyan-600" />
              <AlertTitle>Advanced Analytics</AlertTitle>
              <AlertDescription>
                Comprehensive insights into attendance patterns and student performance
              </AlertDescription>
            </Alert>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Period-wise Detailed Analysis */}
              <Card className="shadow-xl">
                <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
                  <CardTitle>Period-wise Breakdown</CardTitle>
                  <CardDescription>Detailed attendance by period</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.periods}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="rate" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Trend Analysis */}
              <Card className="shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle>30-Day Trend</CardTitle>
                  <CardDescription>Historical attendance pattern</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData.trends}>
                      <defs>
                        <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="attendance" 
                        stroke={COLORS.primary} 
                        fillOpacity={1} 
                        fill="url(#colorAttendance)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

            </div>

            {/* Comprehensive Stats */}
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Overall system performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <Target className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                    <div className="text-3xl font-bold text-blue-600">
                      {formatPercentage(summary?.overallAttendanceAvg || 0)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Target Achievement</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <TrendingUp className="h-8 w-8 mx-auto mb-3 text-green-600" />
                    <div className="text-3xl font-bold text-green-600">
                      {stats?.studentsByYear.reduce((sum, y) => sum + y.count, 0) || 0}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Active Students</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <Activity className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                    <div className="text-3xl font-bold text-purple-600">
                      {sections.length}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Active Sections</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-xl">
                    <AlertCircle className="h-8 w-8 mx-auto mb-3 text-orange-600" />
                    <div className="text-3xl font-bold text-orange-600">
                      {stats?.lowAttendanceCount || 0}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Need Attention</div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* ========================================================================== */}
          {/* TAB: REPORTS */}
          {/* ========================================================================== */}
          {/* ========================================================================== */}
          {/* TAB: REPORTS - FULLY CORRECTED */}
          {/* ========================================================================== */}
          <TabsContent value="reports" className="space-y-6">
            
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-pink-600" />
                  Generate Reports
                </CardTitle>
                <CardDescription>Export and download attendance reports</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Comprehensive Report */}
                  <Card className="border-2 border-blue-200 hover:border-blue-400 transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileDown className="h-5 w-5 text-blue-600" />
                        Comprehensive Report
                      </CardTitle>
                      <CardDescription>Complete attendance data for all students</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        onClick={handleExportAll}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Excel
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Section-wise Report */}
                  <Card className="border-2 border-purple-200 hover:border-purple-400 transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building className="h-5 w-5 text-purple-600" />
                        Section-wise Report
                      </CardTitle>
                      <CardDescription>Attendance data filtered by section</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                        onClick={() => setExportDialogOpen(true)}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Configure & Export
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Low Attendance Report */}
                  <Card className="border-2 border-orange-200 hover:border-orange-400 transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        Critical Alerts Report
                      </CardTitle>
                      <CardDescription>Students with attendance below 75%</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button 
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500"
                        onClick={() => {
                          setAttendanceThreshold('75');
                          setActiveTab('students');
                        }}
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        View & Export
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Monthly Summary */}
                  <Card className="border-2 border-green-200 hover:border-green-400 transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-green-600" />
                        Monthly Summary
                      </CardTitle>
                      <CardDescription>Attendance trends for current month</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button 
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
                        onClick={handleExportAll}
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Year-wise Analysis */}
                  <Card className="border-2 border-cyan-200 hover:border-cyan-400 transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-cyan-600" />
                        Year-wise Analysis
                      </CardTitle>
                      <CardDescription>Comparative analysis across years</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button 
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        onClick={() => setActiveTab('analytics')}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Analytics
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Custom Report Builder */}
                  <Card className="border-2 border-indigo-200 hover:border-indigo-400 transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="h-5 w-5 text-indigo-600" />
                        Custom Report
                      </CardTitle>
                      <CardDescription>Build your own custom report</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button 
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        onClick={() => setExportDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Custom
                      </Button>
                    </CardFooter>
                  </Card>

                </div>

                {/* Quick Stats for Reports */}
                <Separator className="my-8" />
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <FileText className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <div className="text-2xl font-bold">
                      {formatNumber(students?.pagination?.totalRecords || 0)}
                    </div>
                    <div className="text-xs text-gray-600">Total Records</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Calendar className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <div className="text-2xl font-bold">{trends.length}</div>
                    <div className="text-xs text-gray-600">Days Tracked</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Building className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <div className="text-2xl font-bold">{sections.length}</div>
                    <div className="text-xs text-gray-600">Sections Active</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Download className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <div className="text-2xl font-bold">Excel</div>
                    <div className="text-xs text-gray-600">Export Format</div>
                  </div>
                </div>

                {/* Recent Export History (Optional Enhancement) */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                    Quick Export Actions
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Export by Year */}
                    <Card className="border border-gray-200">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">Export by Year</h4>
                            <p className="text-sm text-gray-600">Download all students from a specific year</p>
                          </div>
                          <GraduationCap className="h-8 w-8 text-blue-500" />
                        </div>
                        <Select 
                          value={selectedYear} 
                          onValueChange={(year) => {
                            setSelectedYear(year);
                            if (year) {
                              api.exportAllAttendance(parseInt(year), undefined);
                              toast({ 
                                title: 'Export Started', 
                                description: `Downloading Year ${year} attendance data` 
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {ACADEMIC_YEARS.map(year => (
                              <SelectItem key={year.value} value={year.value}>
                                {year.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>

                    {/* Export by Section */}
                    <Card className="border border-gray-200">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">Export by Section</h4>
                            <p className="text-sm text-gray-600">Download specific section data</p>
                          </div>
                          <Building className="h-8 w-8 text-purple-500" />
                        </div>
                        <Select 
                          value={selectedSection} 
                          onValueChange={(sectionId) => {
                            setSelectedSection(sectionId);
                            if (sectionId) {
                              api.exportAllAttendance(undefined, parseInt(sectionId));
                              const section = sections.find(s => s.id === parseInt(sectionId));
                              toast({ 
                                title: 'Export Started', 
                                description: `Downloading ${section?.section_name} attendance data` 
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Section" />
                          </SelectTrigger>
                          <SelectContent>
                            {sections.map(section => (
                              <SelectItem key={section.id} value={section.id.toString()}>
                                {section.section_name} (Year {section.year})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Report Generation Tips */}
                <Alert className="mt-8 bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle>Report Generation Tips</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                      <li>Excel reports include separate sheets for each student</li>
                      <li>A master sheet with all data is also included</li>
                      <li>Use filters in the Students tab to export specific subsets</li>
                      <li>Large exports may take a few moments to process</li>
                      <li>Reports are generated in real-time from current database</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {/* Summary Statistics Card */}
                <Card className="mt-8 border-2 border-green-200">
                  <CardHeader className="bg-green-50">
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <Target className="h-5 w-5" />
                      Overall Attendance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          {formatPercentage(summary?.overallAttendanceAvg || 0)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Overall Average</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {formatNumber(students?.pagination?.totalRecords || 0)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Total Students</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">
                          {summary?.totalAttendanceDays || 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Days Recorded</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">
                          {stats?.lowAttendanceCount || 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Below 75%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </CardContent>
            </Card>

          </TabsContent>
        </Tabs>
      </main>
    
      {/* ========================================================================== */}
      {/* DIALOGS & MODALS */}
      {/* ========================================================================== */}

       {/* ========================================================================== */}
      {/* DIALOGS & MODALS - CORRECTED VERSION */}
      {/* ========================================================================== */}

      {/* Add Student Dialog */}
      <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-600" />
              Add New Student
            </DialogTitle>
            <DialogDescription>
              Enter student details to add them to the system
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Roll Number</label>
              <Input
                placeholder="e.g., 21CS001"
                value={newStudent.roll_no}
                onChange={(e) => setNewStudent({ ...newStudent, roll_no: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                placeholder="e.g., John Doe"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <Select value={newStudent.year} onValueChange={(v) => setNewStudent({ ...newStudent, year: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACADEMIC_YEARS.map(year => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Section</label>
                <Select value={newStudent.section_id} onValueChange={(v) => setNewStudent({ ...newStudent, section_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections
                      .filter(s => !newStudent.year || s.year === parseInt(newStudent.year))
                      .map(section => (
                        <SelectItem key={section.id} value={section.id.toString()}>
                          {section.section_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStudentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStudent} className="bg-gradient-to-r from-green-500 to-emerald-500">
              <Save className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={editStudentOpen} onOpenChange={setEditStudentOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit Student Details
            </DialogTitle>
            <DialogDescription>
              Update student information
            </DialogDescription>
          </DialogHeader>
          
          {editingStudent && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Roll Number</label>
                <Input
                  value={editingStudent.roll_no}
                  onChange={(e) => setEditingStudent({ ...editingStudent, roll_no: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <Select value={editingStudent.year} onValueChange={(v) => setEditingStudent({ ...editingStudent, year: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACADEMIC_YEARS.map(year => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Section</label>
                  <Select value={editingStudent.section_id} onValueChange={(v) => setEditingStudent({ ...editingStudent, section_id: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sections
                        .filter(s => s.year === parseInt(editingStudent.year))
                        .map(section => (
                          <SelectItem key={section.id} value={section.id.toString()}>
                            {section.section_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStudentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditStudent} className="bg-gradient-to-r from-blue-500 to-cyan-500">
              <Save className="h-4 w-4 mr-2" />
              Update Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this student? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              All attendance records for this student will be permanently deleted.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteStudent}
              className="bg-gradient-to-r from-red-500 to-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Section Dialog */}
      <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-orange-600" />
              Add New Section
            </DialogTitle>
            <DialogDescription>
              Create a new section for students
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Section Name</label>
              <Input
                placeholder="e.g., CSE-A"
                value={newSection.section_name}
                onChange={(e) => setNewSection({ ...newSection, section_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={newSection.year} onValueChange={(v) => setNewSection({ ...newSection, year: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_YEARS.map(year => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSectionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSection} className="bg-gradient-to-r from-orange-500 to-red-500">
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5 text-blue-600" />
              Export Attendance Report
            </DialogTitle>
            <DialogDescription>
              Configure and download attendance reports
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Years</SelectItem>
                  {ACADEMIC_YEARS.map(year => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sections</SelectItem>
                  {sections.map(section => (
                    <SelectItem key={section.id} value={section.id.toString()}>
                      {section.section_name} (Year {section.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">Export Format</label>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button variant="outline" className="flex-1" disabled>
                  <FileDown className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" className="flex-1" disabled>
                  <FileDown className="h-4 w-4 mr-2" />
                  CSV
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportAll} className="bg-gradient-to-r from-blue-500 to-cyan-500">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={bulkImportOpen} onOpenChange={setBulkImportOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-cyan-600" />
              Bulk Import Students
            </DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file to import multiple students at once
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle>Required Format</AlertTitle>
              <AlertDescription>
                Your file should have columns: roll_no, name, section_id, year
              </AlertDescription>
            </Alert>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Supports CSV and Excel files (max 5MB)
              </p>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                id="bulk-import-file"
              />
              <label htmlFor="bulk-import-file">
                <Button variant="outline" className="mt-4" asChild>
                  <span>
                    <FileUp className="h-4 w-4 mr-2" />
                    Choose File
                  </span>
                </Button>
              </label>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <a href="/templates/student-import-template.csv" download>
                  <FileDown className="h-4 w-4 mr-2" />
                  Download Template
                </a>
              </Button>
              <Button variant="outline" className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                Preview Data
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkImportOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500">
              <Upload className="h-4 w-4 mr-2" />
              Import Students
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Profile Sheet (Sidebar) - FULLY CORRECTED */}
      {selectedStudentId && studentProfile && (
        <Sheet open={!!selectedStudentId} onOpenChange={(open) => !open && setSelectedStudentId(null)}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className={cn("text-2xl", getRandomColor(studentProfile.student.name))}>
                    {getInitials(studentProfile.student.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <SheetTitle className="text-2xl">{studentProfile.student.name}</SheetTitle>
                  <SheetDescription>
                    {studentProfile.student.roll_no} • {studentProfile.student.sectionName} • Year {studentProfile.student.year}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Overall Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attendance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold text-green-600">
                        {studentProfile.attendanceSummary.presentCount}
                      </div>
                      <div className="text-xs text-gray-600">Present</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <XCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                      <div className="text-2xl font-bold text-red-600">
                        {studentProfile.attendanceSummary.totalMarked - studentProfile.attendanceSummary.presentCount}
                      </div>
                      <div className="text-xs text-gray-600">Absent</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Percent className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold text-blue-600">
                        {formatPercentage(studentProfile.attendanceSummary.attendancePercentage)}
                      </div>
                      <div className="text-xs text-gray-600">Overall</div>
                    </div>
                  </div>
                  <Progress value={studentProfile.attendanceSummary.attendancePercentage} className="h-3" />
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    {studentProfile.attendanceSummary.presentCount} / {studentProfile.attendanceSummary.totalMarked} periods marked
                  </p>
                </CardContent>
              </Card>

              {/* Monthly Breakdown */}
              {studentProfile.monthlyBreakdown && studentProfile.monthlyBreakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Monthly Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {studentProfile.monthlyBreakdown.map((month, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">{month.month}</span>
                            <Badge variant={month.attendancePercentage >= 75 ? 'default' : 'destructive'}>
                              {formatPercentage(month.attendancePercentage)}
                            </Badge>
                          </div>
                          <Progress value={month.attendancePercentage} className="h-2 mb-1" />
                          <p className="text-xs text-gray-600">
                            {month.presentCount} / {month.totalMarked} periods
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Attendance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Attendance Records
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {studentProfile.recentAttendance && studentProfile.recentAttendance.length > 0 ? (
                        studentProfile.recentAttendance.slice(0, 10).map((record, idx) => {
                          const dayAttendance = calculateDayAttendance({
                            period_0: record.period_0,
                            period_1: record.period_1,
                            period_2: record.period_2,
                            period_3: record.period_3,
                            period_4: record.period_4,
                            period_5: record.period_5,
                            period_6: record.period_6,
                            period_7: record.period_7,
                          });

                          return (
                            <div key={idx} className="p-4 border rounded-lg hover:bg-gray-50">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <p className="font-semibold">{formatDate(record.date)}</p>
                                  <p className="text-xs text-gray-600">Day Order: {record.day_order}</p>
                                </div>
                                <Badge 
                                  variant={dayAttendance.percentage >= 75 ? 'default' : 'destructive'}
                                  className="text-lg px-3 py-1"
                                >
                                  {formatPercentage(dayAttendance.percentage)}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-8 gap-1">
                                {PERIOD_LABELS.map((period, pIdx) => {
                                  const status = (record as any)[`period_${pIdx}`];
                                  const statusInfo = getPeriodStatusIcon(status);
                                  return (
                                    <TooltipProvider key={period}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className={cn(
                                            "h-10 rounded flex items-center justify-center text-xs font-semibold",
                                            statusInfo.bg,
                                            statusInfo.color
                                          )}>
                                            {period}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {status === 1 ? 'Present' : status === 0 ? 'Absent' : 'Not Marked'}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No attendance records found</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <SheetFooter className="mt-6">
              <Button variant="outline" onClick={() => setSelectedStudentId(null)}>
                Close
              </Button>
              <Button onClick={() => handleExportStudent(selectedStudentId)} className="bg-gradient-to-r from-blue-500 to-cyan-500">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}

                    

    </div>
  );
}

