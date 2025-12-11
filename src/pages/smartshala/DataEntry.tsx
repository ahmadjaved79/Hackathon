import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { api, type Student } from '@/lib/api';
import { ArrowLeft, LogOut, Save, Send, Trash2, CheckCircle2, XCircle } from 'lucide-react';

interface SavedEntry {
  id: string;
  date: string;
  year: number;
  section_id: number;
  section_name: string;
  day_order: number;
  period: number;
  absentees: number[];
  absenteeRolls: string[];
  isAllPresent?: boolean; // New flag to track "All Present"
  isAllAbsent?: boolean;  // New flag to track "All Absent"
}

export default function DataEntry() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [year, setYear] = useState<number>(1);
  const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [dayOrder, setDayOrder] = useState<number>(1);
  const [period, setPeriod] = useState<number>(0);
  const [mode, setMode] = useState<'absent' | 'present'>('absent');
  const [rollNumbers, setRollNumbers] = useState('');

  // Local storage for unsaved entries
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔒 Check authentication
  useEffect(() => {
    const role = localStorage.getItem('smartshala_role');
    if (role !== 'teacher' && role !== 'admin') {
      navigate('/smartshala/login');
    }
  }, [navigate]);

  // 🔁 Fetch sections when year changes
  useEffect(() => {
    fetchSections();
  }, [year]);

  const fetchSections = async () => {
    try {
      const data = await api.getSmartSections(year);
      setSections((data || []).map((s) => ({ id: s.id, name: s.section_name })));
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to load sections',
        variant: 'destructive',
      });
    }
  };

  // 💾 Handle Save Locally
  const handleSave = async () => {
    if (!selectedSection || rollNumbers.trim() === '') {
      toast({
        title: 'Validation Error',
        description: 'Please select a section and enter roll numbers.',
        variant: 'destructive',
      });
      return;
    }

    const section = sections.find((s) => s.id === parseInt(selectedSection));
    if (!section) return;

    // Fetch all students for this section
    let students: Student[];
    try {
      students = await api.getSmartShaalaStudents(section.id, year);
    } catch (studentsError) {
      toast({
        title: 'Error',
        description: 'Failed to fetch students',
        variant: 'destructive',
      });
      return;
    }

    // 🧮 Add section prefix to roll numbers (e.g., NSBO01)
    const inputRolls = rollNumbers
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean)
      .map((r) => `${section.name}${r}`);

    // ✅ Validate roll numbers
    const validRolls = students?.filter((s) => inputRolls.includes(s.roll_no)) || [];
    const invalidRolls = inputRolls.filter((r) => !students?.some((s) => s.roll_no === r));

    if (invalidRolls.length > 0) {
      toast({
        title: 'Invalid Roll Numbers',
        description: `These roll numbers don't exist: ${invalidRolls.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    // 💾 Calculate absentee roll numbers properly
    let absenteeRolls: string[] = [];
    let absenteeIds: number[] = [];

    if (mode === 'absent') {
      // User entered absent students
      absenteeRolls = validRolls.map((s) => s.roll_no);
      absenteeIds = validRolls.map((s) => s.id);
    } else {
      // User entered present students - calculate absent ones
      const presentIds = validRolls.map((s) => s.id);
      absenteeIds = students?.filter((s) => !presentIds.includes(s.id)).map((s) => s.id) || [];
      absenteeRolls = students?.filter((s) => !presentIds.includes(s.id)).map((s) => s.roll_no) || [];
    }

    // 💾 Save locally
    const newEntry: SavedEntry = {
      id: `${Date.now()}-${Math.random()}`,
      date,
      year,
      section_id: section.id,
      section_name: section.name,
      day_order: dayOrder,
      period,
      absentees: absenteeIds,
      absenteeRolls,
      isAllPresent: false,
      isAllAbsent: false,
    };

    setSavedEntries([...savedEntries, newEntry]);
    setRollNumbers('');
    setPeriod((period + 1) % 8); // Periods 0-7

    toast({
      title: 'Saved Locally',
      description: 'Entry saved locally. Click Submit to upload to database.',
    });
  };

  // ✅ Handle "All Present" for a period
  const handleAllPresent = async () => {
    if (!selectedSection) {
      toast({
        title: 'Validation Error',
        description: 'Please select a section first.',
        variant: 'destructive',
      });
      return;
    }

    const section = sections.find((s) => s.id === parseInt(selectedSection));
    if (!section) return;

    // Fetch all students for this section
    let students: Student[];
    try {
      students = await api.getSmartShaalaStudents(section.id, year);
    } catch (studentsError) {
      toast({
        title: 'Error',
        description: 'Failed to fetch students',
        variant: 'destructive',
      });
      return;
    }

    // For "All Present", absentees array is empty
    const newEntry: SavedEntry = {
      id: `${Date.now()}-${Math.random()}`,
      date,
      year,
      section_id: section.id,
      section_name: section.name,
      day_order: dayOrder,
      period,
      absentees: [], // No absentees - everyone is present
      absenteeRolls: [],
      isAllPresent: true,
      isAllAbsent: false,
    };

    setSavedEntries([...savedEntries, newEntry]);
    setPeriod((period + 1) % 8);

    toast({
      title: 'All Present Marked',
      description: `Period ${period}: All students marked present locally.`,
    });
  };

  // ❌ Handle "All Absent" for a period
  const handleAllAbsent = async () => {
    if (!selectedSection) {
      toast({
        title: 'Validation Error',
        description: 'Please select a section first.',
        variant: 'destructive',
      });
      return;
    }

    const section = sections.find((s) => s.id === parseInt(selectedSection));
    if (!section) return;

    // Fetch all students for this section
    let students: Student[];
    try {
      students = await api.getSmartShaalaStudents(section.id, year);
    } catch (studentsError) {
      toast({
        title: 'Error',
        description: 'Failed to fetch students',
        variant: 'destructive',
      });
      return;
    }

    // For "All Absent", all students are absentees
    const newEntry: SavedEntry = {
      id: `${Date.now()}-${Math.random()}`,
      date,
      year,
      section_id: section.id,
      section_name: section.name,
      day_order: dayOrder,
      period,
      absentees: students.map(s => s.id),
      absenteeRolls: students.map(s => s.roll_no),
      isAllPresent: false,
      isAllAbsent: true,
    };

    setSavedEntries([...savedEntries, newEntry]);
    setPeriod((period + 1) % 8);

    toast({
      title: 'All Absent Marked',
      description: `Period ${period}: All students marked absent locally.`,
    });
  };

  // ☁️ Submit to Database
  const handleSubmit = async () => {
    if (savedEntries.length === 0) {
      toast({
        title: 'No Entries',
        description: 'Please save at least one entry before submitting',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get all students for the section to mark attendance for everyone
      const section = sections.find((s) => s.id === savedEntries[0].section_id);
      if (!section) {
        throw new Error('Section not found');
      }

      const allStudents = await api.getSmartShaalaStudents(section.id, savedEntries[0].year);

      // Group entries by date and day_order
      const groupedByDate = new Map<string, SavedEntry[]>();
      savedEntries.forEach((entry) => {
        const key = `${entry.date}-${entry.day_order}`;
        if (!groupedByDate.has(key)) {
          groupedByDate.set(key, []);
        }
        groupedByDate.get(key)!.push(entry);
      });

      let successCount = 0;
      let errorCount = 0;

      // Process each date group
      for (const [dateKey, entries] of groupedByDate) {
        const firstEntry = entries[0];

        // For each student, create an attendance record
        for (const student of allStudents) {
          // Initialize all periods as -1 (not marked)
          const periodData: Record<string, number> = {
            period_0: -1,
            period_1: -1,
            period_2: -1,
            period_3: -1,
            period_4: -1,
            period_5: -1,
            period_6: -1,
            period_7: -1,
          };

          // Mark periods based on saved entries
          entries.forEach((entry) => {
            const periodKey = `period_${entry.period}`;
            
            if (entry.isAllPresent) {
              // All students are present for this period
              periodData[periodKey] = 1;
            } else if (entry.isAllAbsent) {
              // All students are absent for this period
              periodData[periodKey] = 0;
            } else {
              // Check individual attendance
              if (entry.absentees.includes(student.id)) {
                // Student is absent for this period
                periodData[periodKey] = 0;
              } else {
                // Student is present for this period (only if it's marked)
                if (periodData[periodKey] === -1) {
                  periodData[periodKey] = 1;
                }
              }
            }
          });

          // Call the mark-student API for each student
          try {
            await api.markStudentAttendance({
              student_id: student.id,
              date: firstEntry.date,
              day_order: firstEntry.day_order,
              year: firstEntry.year,
              section_name: firstEntry.section_name,
              period_0: periodData.period_0,
              period_1: periodData.period_1,
              period_2: periodData.period_2,
              period_3: periodData.period_3,
              period_4: periodData.period_4,
              period_5: periodData.period_5,
              period_6: periodData.period_6,
              period_7: periodData.period_7,
            });
            successCount++;
          } catch (error) {
            console.error(`Error marking attendance for student ${student.id}:`, error);
            errorCount++;
          }
        }
      }

      toast({
        title: 'Success',
        description: `${successCount} attendance records submitted successfully. ${errorCount > 0 ? `${errorCount} failed.` : ''}`,
      });

      setSavedEntries([]);
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit attendance records.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🗑️ Delete Local Entry
  const handleDelete = (id: string) => {
    setSavedEntries(savedEntries.filter((e) => e.id !== id));
    toast({
      title: 'Deleted',
      description: 'Entry removed from local storage',
    });
  };

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.removeItem('smartshala_role');
    localStorage.removeItem('smartshala_username');
    navigate('/smartshala/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/landing')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Attendance Data Entry
            </h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Entry Form */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Record Attendance</CardTitle>
            <CardDescription>
              Fill in details and save entries locally before submitting to the database.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Form Fields */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {/* Year */}
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Section */}
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={section.id.toString()}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Day Order */}
              <div className="space-y-2">
                <Label htmlFor="dayOrder">Day Order</Label>
                <Select value={dayOrder.toString()} onValueChange={(v) => setDayOrder(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((d) => (
                      <SelectItem key={d} value={d.toString()}>
                        Day {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Period */}
              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <Select value={period.toString()} onValueChange={(v) => setPeriod(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Period" />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((p) => (
                      <SelectItem key={p} value={p.toString()}>
                        Period {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mode */}
              <div className="space-y-2">
                <Label>Mode</Label>
                <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'absent' | 'present')}>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="absent" id="absent" />
                      <Label htmlFor="absent" className="font-normal">Mark Absent</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="present" id="present" />
                      <Label htmlFor="present" className="font-normal">Mark Present</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Roll Numbers */}
            <div className="space-y-2">
              <Label htmlFor="rollNumbers">
                Roll Numbers (comma-separated, without section prefix)
              </Label>
              <Input
                id="rollNumbers"
                placeholder="e.g., 01, 02, 03"
                value={rollNumbers}
                onChange={(e) => setRollNumbers(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Section prefix will be added automatically
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button onClick={handleSave} className="w-full" variant="secondary">
                <Save className="mr-2 h-4 w-4" /> Save Entry
              </Button>
              
              <Button 
                onClick={handleAllPresent} 
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> All Present
              </Button>
              
              <Button 
                onClick={handleAllAbsent} 
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <XCircle className="mr-2 h-4 w-4" /> All Absent
              </Button>
              
              <Button
                onClick={handleSubmit}
                variant="default"
                className="w-full"
                disabled={isSubmitting || savedEntries.length === 0}
              >
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Submitting...' : `Submit (${savedEntries.length})`}
              </Button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Quick Tips:</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• <strong>All Present:</strong> Marks entire class as present for the selected period</li>
                <li>• <strong>All Absent:</strong> Marks entire class as absent for the selected period</li>
                <li>• <strong>Save Entry:</strong> Use for marking specific students based on mode</li>
                <li>• Save multiple periods locally, then submit all at once</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Saved Entries */}
        {savedEntries.length > 0 && (
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Saved Entries ({savedEntries.length})</CardTitle>
              <CardDescription>
                These entries are saved locally and will be uploaded on submit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Day Order</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Absentees</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savedEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.date}</TableCell>
                        <TableCell>{entry.year}</TableCell>
                        <TableCell>{entry.section_name}</TableCell>
                        <TableCell>{entry.day_order}</TableCell>
                        <TableCell>{entry.period}</TableCell>
                        <TableCell>
                          {entry.isAllPresent && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              All Present
                            </span>
                          )}
                          {entry.isAllAbsent && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              <XCircle className="w-3 h-3 mr-1" />
                              All Absent
                            </span>
                          )}
                          {!entry.isAllPresent && !entry.isAllAbsent && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Partial
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.isAllPresent && 'None'}
                          {entry.isAllAbsent && 'All Students'}
                          {!entry.isAllPresent && !entry.isAllAbsent && (
                            entry.absenteeRolls && entry.absenteeRolls.length > 0
                              ? entry.absenteeRolls.join(', ')
                              : 'All Present'
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
