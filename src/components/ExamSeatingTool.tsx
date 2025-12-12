import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileUpload } from '@/components/FileUpload';
import { EnhancedRoomConfiguration } from '@/components/EnhancedRoomConfiguration';
import { AllocationModeSelector } from '@/components/AllocationModeSelector';
import { ArrangementModeSelector, ArrangementMode } from '@/components/ArrangementModeSelector';
import { ArrangementProgressLoader } from '@/components/ArrangementProgressLoader';
import { SeatingDisplay } from '@/components/SeatingDisplay';
import { AntiCheatingSummary } from '@/components/AntiCheatingSummary';
import { SubjectManager } from '@/components/SubjectManager';
import { RoomPriorityManager } from '@/components/RoomPriorityManager';
import { MasterEdit } from '@/components/MasterEdit';
import { generateSeatingArrangement } from '@/utils/seatingLogic';
import { downloadAllPDFs, downloadQuestionPaperAllocation } from '@/utils/pdfGenerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, Settings, Download, Calendar, FileText, Cog, Star, UserCog, Database, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export interface Student {
  roll: string;
  branch: string;
  num:number;
  subject?: string;
}

export interface Room {
  id: string;
  name: string;
  rows: number;
  columns: number;
  selected: boolean;
  block: string;
  type: 'Classroom' | 'Seminar Hall';
  customAllotment?: number;
  priority?: number;
}

export interface SeatingArrangement {
  roomId: string;
  roomName: string;
  students: (Student | null)[][];
  branchCounts: { [branch: string]: number };
}

let PREDEFINED_ROOMS: Room[] = [
  { id: '4', name: '1N3', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 14 },
  { id: '14', name: '1S2', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 22 },
  { id: '15', name: '1S3', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 23 },
  { id: '16', name: '1S4', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 24 },
  { id: '39', name: '1S8', rows: 6, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 47 },
  { id: '40', name: '1S9', rows: 6, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 48 },
  { id: '41', name: '1S10', rows: 6, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 49 },
  { id: '22', name: '2N6', rows: 4, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 30 },
  { id: '1', name: '2N7', rows: 10, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 1 },
  { id: '5', name: '2N8', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 15 },
  { id: '6', name: '2N9', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 16 },
  { id: '2', name: '2N10', rows: 10, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 2 },
  { id: '8', name: '2N11', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 17 },
  { id: '17', name: '2S6A', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 25 },
  { id: '18', name: '2S6B', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 26 },
  { id: '42', name: '2S6C', rows: 6, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 50 },
  { id: '19', name: '2S7', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 27 },
  { id: '20', name: '2S8', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 28 },
  { id: '21', name: '2S9', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 29 },
  { id: '43', name: '2S10', rows: 6, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 51 },
  { id: '44', name: '2S11', rows: 6, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 52 },
  { id: '45', name: '2S12', rows: 6, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 53 },
  { id: '46', name: '2S14', rows: 6, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 54 },
  { id: '47', name: '2S15', rows: 6, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 55 },
  { id: '9', name: '3N1', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 18 },
  { id: '23', name: '3N2', rows: 4, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 31 },
  { id: '24', name: '3N3', rows: 4, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 32 },
  { id: '25', name: '3N5', rows: 4, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 33 },
  { id: '26', name: '3N6', rows: 4, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 34 },
  { id: '10', name: '3N7', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 19 },
  { id: '3', name: '3N10', rows: 10, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 3 },
  { id: '11', name: '3N11', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 20 },
  { id: '12', name: '3N12', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 21 },
  { id: '13', name: '3N14', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 21 },
  { id: '27', name: '3N15', rows: 4, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 35 },
  { id: '28', name: '3N16', rows: 4, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 36 },
  { id: '29', name: '3N17', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 37 },
  { id: '30', name: '3N18', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 38 },
  { id: '31', name: '3N19', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 39 },
  { id: '32', name: '3N20', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 40 },
  { id: '33', name: '3N21', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 41 },
  { id: '48', name: '3S1', rows: 6, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 56 },
  { id: '49', name: '3S2', rows: 6, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 57 },
  { id: '50', name: '3S3', rows: 6, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 58 },
  { id: '51', name: '3S4', rows: 6, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 59 },
  { id: '52', name: '3S5', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 60 },
  { id: '34', name: '4N6', rows: 5, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 42 },
  { id: '35', name: '4N7', rows: 5, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 43 },
  { id: '36', name: '4N8', rows: 6, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 44 },
  { id: '37', name: '4N9', rows: 6, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 45 },
  { id: '38', name: '4N10', rows: 6, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 46 },
  { id: '53', name: '4S1', rows: 7, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 47 },
  { id: '54', name: '4S2', rows: 9, columns: 9, selected: false, block: 'Main Block', type: 'Classroom', priority: 47 },
];




     

export interface AllocationMode {
  type: 'even' | 'customised';
  evenType?: 'default' | 'max' | 'custom';
  customNumber?: number;
}

export const ExamSeatingTool: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>(PREDEFINED_ROOMS);
  
  const [arrangements, setArrangements] = useState<SeatingArrangement[]>([]);
  const [examDate, setExamDate] = useState<string>('');
  const [examStartTime, setExamStartTime] = useState<string>('');
  const [examEndTime, setExamEndTime] = useState<string>('');
  const [examTitle, setExamTitle] = useState<string>('III BTECH SEM-I WEEKLY TEST-I JULY/AUG 2025');
  const [isAutonomous, setIsAutonomous] = useState(false);
  
  const [allocationMode, setAllocationMode] = useState<AllocationMode>({ type: 'even', evenType: 'max' });
  const [arrangementMode, setArrangementMode] = useState<ArrangementMode>('complex');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<{[branch: string]: {subject: string, subjectTitle: string}}>({});
  const [showMasterEdit, setShowMasterEdit] = useState(false);
  const [showRoomPriority, setShowRoomPriority] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [studentsProcessed, setStudentsProcessed] = useState(0);
  const [roomsCompleted, setRoomsCompleted] = useState(0);
  
  // Invigilator state
  const [invigilatorAssignment, setInvigilatorAssignment] = useState<{[roomName: string]: string[]} | null>(null);
  const [invigilators, setInvigilators] = useState<string[]>([]);

  // Handle incoming state from other pages
  useEffect(() => {
    if (location.state) {
      // From Invigilators page
      if (location.state.invigilatorAssignment) {
        setInvigilatorAssignment(location.state.invigilatorAssignment);
        setInvigilators(location.state.invigilators || []);
      }
      
      // From Database Management page
      if (location.state.databaseBranches && location.state.databaseSubjects) {
        const branchData = location.state.databaseBranches as {[branch: string]: string[]};
        const subjectData = location.state.databaseSubjects as {[branch: string]: {subject: string, subjectTitle: string}};
        
        const studentsFromDB: Student[] = [];
        Object.entries(branchData).forEach(([branch, rollNumbers]) => {
          rollNumbers.forEach((roll, index) => {
            studentsFromDB.push({ roll, branch, num: index + 1 });
          });
        });
        
        setStudents(studentsFromDB);
        setSubjects(subjectData);
        
        toast({
          title: 'Success',
          description: `Loaded ${studentsFromDB.length} students from database`,
        });
      }
    }
  }, [location.state]);

  
const handleFileUpload = async (file: File) => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    const extractedStudents: Student[] = [];

    // First row = subjects
    const subjects = jsonData[0] as string[];

    for (let colIndex = 0; colIndex < subjects.length; colIndex++) {
      const subject = subjects[colIndex];
      if (!subject) continue;

      // For each student row
      for (let rowIndex = 1; rowIndex < jsonData.length; rowIndex++) {
        const rollRaw = jsonData[rowIndex][colIndex];
        if (!rollRaw) continue;

        const roll = rollRaw.toString().trim();
        if (!roll) continue;

        // NEW PARSING LOGIC:
        // Format: XXXXXNNN  (last 3 chars numeric)
        const rollNumberPart = roll.slice(-3);           // "047"
        const sectionPart = roll.slice(0, roll.length-3); // "24SBT"

        // Validate last 3 chars are digits
        const isValid = /^\d{3}$/.test(rollNumberPart);

        const num = isValid ? rollNumberPart : "000";
        const section = sectionPart || "UNKNOWN";

        extractedStudents.push({
          roll,       // full roll like "24SBT047"
          branch: section,   // aligning with your existing field name
          num,
          subject,
        });
      }
    }

    setStudents(extractedStudents);
    toast({
      title: "Success",
      description: `Loaded ${extractedStudents.length} students from Excel file.`,
    });

  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to parse Excel file.",
      variant: "destructive",
    });
  }
};

  const handleRoomToggle = (roomId: string) => {
    setRooms(prev => prev.map(room => 
      room.id === roomId ? { ...room, selected: !room.selected } : room
    ));
    setValidationErrors([]);
  };

  const handleRoomDimensionChange = (roomId: string, rows: number, columns: number) => {
    setRooms(prev => prev.map(room => 
      room.id === roomId ? { ...room, rows, columns } : room
    ));
    setValidationErrors([]);
  };

  const handleCustomAllotmentChange = (roomId: string, allotment: number) => {
    setRooms(prev => prev.map(room => 
      room.id === roomId ? { ...room, customAllotment: allotment } : room
    ));
    setValidationErrors([]);
  };

  const handleRoomPriorityChange = (roomId: string, newPriority: number) => {
    setRooms(prev => prev.map(room => 
      room.id === roomId ? { ...room, priority: newPriority } : room
    ));
  };

  const validateAllocation = (): boolean => {
    const errors: string[] = [];
    const selectedRooms = rooms.filter(room => room.selected);

    // Special validation for seminar halls - they must have custom allotment
    const seminarHalls = selectedRooms.filter(room => room.type === 'Seminar Hall');
    seminarHalls.forEach(room => {
      if (!room.customAllotment || room.customAllotment === 0) {
        errors.push(`Seminar Hall ${room.name} requires manual allotment entry`);
      } else if (room.customAllotment > (room.rows * room.columns)) {
        errors.push(`Seminar Hall ${room.name} allotment ${room.customAllotment} exceeds capacity ${room.rows * room.columns}`);
      }
    });

    if (allocationMode.type === 'even') {
      if (allocationMode.evenType === 'custom' && allocationMode.customNumber) {
        const problematicRooms = selectedRooms.filter(room => 
          (room.rows * room.columns) < allocationMode.customNumber!
        );
        
        if (problematicRooms.length > 0) {
          problematicRooms.forEach(room => {
            errors.push(`Room ${room.name} (${room.id}) capacity ${room.rows * room.columns} is less than requested ${allocationMode.customNumber}`);
          });
        }
      }
    } else if (allocationMode.type === 'customised') {
      selectedRooms.forEach(room => {
        if (room.customAllotment && room.customAllotment > (room.rows * room.columns)) {
          errors.push(`Room ${room.name} (${room.id}) custom allotment ${room.customAllotment} exceeds capacity ${room.rows * room.columns}`);
        }
      });
    }

    setValidationErrors(errors);
    
    if (errors.length > 0) {
      toast({
        title: "Allocation Error",
        description: "Please remove highlighted rooms or adjust allocation numbers.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const generateSeating = async () => {
    const selectedRooms = rooms.filter(room => room.selected);
    
    if (selectedRooms.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one room.",
        variant: "destructive",
      });
      return;
    }

    if (students.length === 0) {
      toast({
        title: "Error", 
        description: "Please upload student data first.",
        variant: "destructive",
      });
      return;
    }

    // Validate allocation before proceeding
    if (!validateAllocation()) {
      return;
    }

    // Calculate total seats based on allocation mode
    let totalExpectedAllocation = 0;
    
    selectedRooms.forEach(room => {
      if (room.type === 'Seminar Hall') {
        // Seminar halls always use custom allotment
        totalExpectedAllocation += room.customAllotment || 0;
      } else {
        // Classrooms follow allocation mode
        if (allocationMode.type === 'even') {
          if (allocationMode.evenType === 'default') {
            totalExpectedAllocation += 24;
          } else if (allocationMode.evenType === 'max') {
            totalExpectedAllocation += room.rows * room.columns;
          } else if (allocationMode.evenType === 'custom' && allocationMode.customNumber) {
            totalExpectedAllocation += allocationMode.customNumber;
          }
        } else if (allocationMode.type === 'customised') {
          totalExpectedAllocation += room.customAllotment || 0;
        }
      }
    });
    
    if (students.length > totalExpectedAllocation) {
      toast({
        title: "Error",
        description: `Not enough allocation! You have ${students.length} students but only ${totalExpectedAllocation} seats allocated. Please adjust allocation or reduce students.`,
        variant: "destructive",
      });
      return;
    }

    // Start generating with progress tracking
    setIsGenerating(true);
    setProgress(0);
    setCurrentStep('Initializing...');
    setStudentsProcessed(0);
    setRoomsCompleted(0);

    try {
      const seatingArrangements = await new Promise<any[]>((resolve) => {
        // Use setTimeout to allow UI to update
        setTimeout(() => {
          const result = generateSeatingArrangement(
            students, 
            selectedRooms, 
            [], 
            allocationMode, 
            arrangementMode, 
            Date.now(), 
            subjects,
            (progress, step, studentsProcessed, roomsCompleted) => {
              setProgress(progress);
              setCurrentStep(step);
              setStudentsProcessed(studentsProcessed);
              setRoomsCompleted(roomsCompleted);
            }
          );
          resolve(result);
        }, 100);
      });

      setArrangements(seatingArrangements);
      
      toast({
        title: "Success",
        description: `Generated seating arrangement for ${students.length} students across ${selectedRooms.length} rooms.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate seating arrangement.",
        variant: "destructive",
      });
    } finally {
      // Keep the loader visible for a brief moment to show completion
      setTimeout(() => {
        setIsGenerating(false);
      }, 1000);
    }
  };

  const handleDownloadAllPDFs = async () => {
    if (arrangements.length === 0) return;
    
    try {
      await downloadAllPDFs(arrangements, examDate, examTitle, examStartTime, examEndTime, subjects, isAutonomous, rooms);
      toast({
        title: "Success",
        description: "All PDFs downloaded successfully as ZIP file.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download PDFs.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadConsolidatedPDF = async () => {
    if (arrangements.length === 0) return;
    
    try {
      const { downloadConsolidatedPDF } = await import('@/utils/pdfGenerator');
      await downloadConsolidatedPDF(arrangements, examDate, examTitle, examStartTime, examEndTime);
      toast({
        title: "Success",
        description: "Consolidated lookup PDF downloaded successfully.",
      });
    } catch (error) {
      alert(error);
      toast({
        title: "Error",
        description: "Failed to download consolidated PDF.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadQuestionPaperAllocation = async () => {
    if (arrangements.length === 0) return;
    
    try {
      await downloadQuestionPaperAllocation(arrangements, examDate, examTitle,examStartTime,examEndTime, subjects, rooms);
      toast({
        title: "Success",
        description: "Papers per room downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download papers per room.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAttendanceSheets = async () => {
    if (arrangements.length === 0) return;
    
    try {
      const { downloadAttendanceSheets } = await import('@/utils/pdfGenerator');
      await downloadAttendanceSheets(arrangements, examDate, examTitle, examStartTime, examEndTime, subjects, isAutonomous, rooms);
      toast({
        title: "Success",
        description: "Attendance sheets downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download attendance sheets.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadCrossVerification = async () => {
    if (arrangements.length === 0) return;
    
    try {
      const { downloadCrossVerificationSheet } = await import('@/utils/pdfGenerator');
      await downloadCrossVerificationSheet(arrangements, examDate, examTitle, examStartTime, examEndTime, subjects, isAutonomous);
      toast({
        title: "Success",
        description: "Cross verification sheet downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download cross verification sheet.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadInvigilatorAllotment = async () => {
    if (!invigilatorAssignment || arrangements.length === 0) {
      toast({
        title: "Error",
        description: "No invigilator assignment found. Please add invigilators first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { downloadInvigilatorAllotment } = await import('@/utils/pdfGenerator');
      await downloadInvigilatorAllotment(invigilatorAssignment, arrangements);
      toast({
        title: "Success",
        description: "Invigilator allotment downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download invigilator allotment.",
        variant: "destructive",
      });
    }
  };

  const handleNavigateToInvigilators = () => {
    const selectedRooms = rooms.filter(r => r.selected);
    if (selectedRooms.length === 0) {
      toast({
        title: "Error",
        description: "Please select rooms first",
        variant: "destructive",
      });
      return;
    }
    navigate('/invigilators', { state: { rooms: selectedRooms } });
  };

  const handleNavigateToDatabase = () => {
    navigate('/database');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Exam Seating using Vigilseat
          </h1>
          <p className="text-muted-foreground text-lg">
            Professional exam seating arrangement management system
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Button onClick={handleNavigateToInvigilators} variant="outline" className="gap-2">
              <UserCog className="h-4 w-4" />
              Add Invigilators
            </Button>
            {/* <Button onClick={handleNavigateToDatabase} variant="outline" className="gap-2">
              <Database className="h-4 w-4" />
              Use Database
            </Button> */}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <FileUpload onFileUpload={handleFileUpload} studentsCount={students.length} />
        
        </div>
        
        <AllocationModeSelector
          allocationMode={allocationMode}
          onAllocationModeChange={setAllocationMode}
          maxRoomCapacity={Math.max(...rooms.map(room => room.rows * room.columns))}
        />

      

        <div className="flex justify-center gap-4">
      
          
          <Button 
            variant={showRoomPriority ? "default" : "outline"} 
            onClick={() => setShowRoomPriority(!showRoomPriority)}
            className="gap-2"
          >
            <Star className="h-4 w-4" />
            {showRoomPriority ? "Hide Room Priority" : "Show Room Priority"}
          </Button>
        </div>

        
        <EnhancedRoomConfiguration
          rooms={rooms}
          onRoomToggle={handleRoomToggle}
          onCustomAllotmentChange={handleCustomAllotmentChange}
          onRoomDimensionChange={handleRoomDimensionChange}
          onRoomsChange={setRooms}
          allocationMode={allocationMode}
          validationErrors={validationErrors}
        />

        {showRoomPriority && (
          <RoomPriorityManager 
            rooms={rooms} 
            onRoomPriorityChange={handleRoomPriorityChange} 
          />
        )}

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Exam Details
              </CardTitle>
              <CardDescription>
                Set exam date and title for PDF headers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Exam Date</label>
                <Input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Time</label>
                  <Input
                    type="time"
                    value={examStartTime}
                    onChange={(e) => setExamStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">End Time</label>
                  <Input
                    type="time"
                    value={examEndTime}
                    onChange={(e) => setExamEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Exam Title</label>
                <Input
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="Enter exam title"
                />
              </div>
              
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={generateSeating}
              disabled={students.length === 0 || rooms.filter(r => r.selected).length === 0}
              className="w-full"
              size="lg"
            >
              <Users className="mr-2 h-4 w-4" />
              Generate Seating Arrangement
            </Button>
            
            {arrangements.length > 0 && (
              <div className="space-y-2">
                <div className="grid gap-2 md:grid-cols-2">
                  <Button 
                    onClick={handleDownloadAllPDFs}
                    disabled={arrangements.length === 0}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download All PDFs
                  </Button>
                  <Button 
                    onClick={handleDownloadConsolidatedPDF}
                    disabled={arrangements.length === 0}
                    variant="outline"
                    className="flex-1"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Notice Board 
                  </Button>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <Button 
                    onClick={handleDownloadQuestionPaperAllocation}
                    disabled={arrangements.length === 0}
                    variant="secondary"
                    className="flex-1"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Papers Per Room
                  </Button>
                  <Button 
                    onClick={handleDownloadAttendanceSheets}
                    disabled={arrangements.length === 0}
                    variant="secondary"
                    className="flex-1"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Attendance Sheets
                  </Button>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <Button 
                    onClick={handleDownloadCrossVerification}
                    disabled={arrangements.length === 0}
                    variant="outline"
                    className="flex-1"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Cross Verification
                  </Button>
                  <Button 
                    onClick={handleDownloadInvigilatorAllotment}
                    disabled={!invigilatorAssignment || arrangements.length === 0}
                    variant="outline"
                    className="flex-1"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Invigilator Allotment
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {arrangements.length > 0 && (
          <>
     <SeatingDisplay arrangements={arrangements} examDate={examDate} examTitle={examTitle} examStartTime={examStartTime} examEndTime={examEndTime} subjects={subjects} isAutonomous={isAutonomous} />
            <AntiCheatingSummary 
              totalStudents={students.length}
              totalRooms={rooms.filter(r => r.selected).length}
            />
          </>
        )}
      </div>
    </div>
  );
};

    

    
