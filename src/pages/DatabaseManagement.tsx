import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Trash2, Edit, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { api } from '@/lib/api';
import { Progress } from '@/components/ui/progress';

interface Branch {
  id: string;
  branch_code: string;
  branch_title: string | null;
  student_count: number;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: string;
  branch_id: string;
  roll_number: string;
  student_name?: string | null;
  created_at: string;
  updated_at: string;
}

const STUDENT_INSERT_BATCH = 1000;

export default function DatabaseManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [students, setStudents] = useState<{ [branchId: string]: Student[] }>({});
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingBranch, setEditingBranch] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    branch_code: '',
    branch_title: '',
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const data = await api.getBranches();
      setBranches(data || []);
      // Fetch students for each branch (do not await all sequentially)
      (data || []).forEach((b) => fetchStudentsForBranch(b.id));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load branches',
        variant: 'destructive',
      });
    }
  };

  const fetchStudentsForBranch = async (branchId: string) => {
    try {
      const data = await api.getStudentsByBranch(branchId);
      setStudents((prev) => ({ ...prev, [branchId]: data }));
    } catch (error) {
      console.error('fetchStudentsForBranch error', error);
    }
  };

  // Helper: chunk array into batches
  const chunk = <T,>(arr: T[], size = 1000): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  // File format expected:
  // First row: headers (branch_code or branch_title)
  // Each column under a header contains roll numbers (one per cell)
  // Example:
  // | CS | ME |
  // | CS2025001 | ME2025001 |
  // | CS2025002 | ME2025002 |
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rows || rows.length === 0) {
          throw new Error('Uploaded file is empty or could not be parsed.');
        }

        const headersRow = rows[0].map((h: any) => (h === null || h === undefined ? '' : String(h).trim()));
        if (headersRow.length === 0) {
          throw new Error('No headers found in the first row. Expected branch codes as headers.');
        }

        // Build branch => rollNumbers mapping from columns
        const branchColumns: {
          header: string;
          rollNumbers: string[];
        }[] = [];

        for (let c = 0; c < headersRow.length; c++) {
          const headerRaw = headersRow[c];
          if (!headerRaw) continue; // skip empty headers
          const header = String(headerRaw).trim();
          const rollNumbers: string[] = [];
          for (let r = 1; r < rows.length; r++) {
            const cell = rows[r][c];
            if (cell === undefined || cell === null) continue;
            const val = String(cell).trim();
            if (val !== '') rollNumbers.push(val);
          }
          branchColumns.push({ header, rollNumbers });
        }

        if (branchColumns.length === 0) {
          throw new Error('No branch columns detected. Ensure first row contains branch codes/titles.');
        }

        // Process each branch column: upsert branch, delete existing students, insert new students (batched)
        const totalBranches = branchColumns.length;
        let processed = 0;

        for (const col of branchColumns) {
          // Decide branch_code and branch_title:
          // If header contains ' - ' treat left as code and right as title (e.g., "CS - Computer Science")
          let branch_code = col.header;
          let branch_title: string | null = null;
          if (col.header.includes(' - ')) {
            const [code, ...rest] = col.header.split(' - ');
            branch_code = code.trim();
            branch_title = rest.join(' - ').trim() || null;
          } else {
            // header might be just branch_code; keep title null
            branch_code = col.header;
            branch_title = null;
          }

          // Upsert branch by branch_code
          try {
            const branchResult = await api.upsertBranch({
              branch_name: branch_code,
              subject_code: branch_code,
              subject_title: branch_title || '',
              student_count: col.rollNumbers.length,
            });

            // Delete existing students for this branch (we replace)
            await api.deleteStudentsByBranch(branchResult.id);
          } catch (branchError) {
            console.error('Branch upsert error', branchError);
            toast({
              title: 'Error',
              description: `Failed to upsert branch ${branch_code}. See console for details.`,
              variant: 'destructive',
            });
            processed++;
            setUploadProgress((processed / totalBranches) * 100);
            continue;
          }

          const branchResult = await api.upsertBranch({
            branch_name: branch_code,
            subject_code: branch_code,
            subject_title: branch_title || '',
            student_count: col.rollNumbers.length,
          });

          // Prepare student records; map rollNumbers to unique set to avoid duplicates
          const uniqueRolls = Array.from(new Set(col.rollNumbers.map((r) => String(r).trim()).filter(Boolean)));

          // Insert in batches
          const batches = chunk(uniqueRolls, STUDENT_INSERT_BATCH);
          for (const batch of batches) {
            const studentRecords = batch.map((rollNumber) => ({
              branch_id: branchResult.id,
              roll_number: rollNumber,
            }));
            try {
              await api.insertStudentsBatch(studentRecords);
            } catch (insertError) {
              console.error(`Failed inserting students for branch ${branch_code}`, insertError);
            }
          }

          // Update student count
          await api.updateBranch(branchResult.id, { student_count: uniqueRolls.length });

          processed++;
          setUploadProgress((processed / totalBranches) * 100);
        }

        // Refresh local state
        await fetchBranches();
        toast({
          title: 'Success',
          description: `Imported ${totalBranches} branch columns.`,
        });
      } catch (err: any) {
        console.error('Import error', err);
        toast({
          title: 'Error',
          description: err?.message || 'Failed to import Excel file',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        // clear file input value (if needed)
        const fileInput = document.getElementById('branch-file') as HTMLInputElement | null;
        if (fileInput) fileInput.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDeleteBranch = async (branchId: string) => {
    try {
      await api.deleteBranch(branchId);
      toast({
        title: 'Success',
        description: 'Branch deleted successfully',
      });
      fetchBranches();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete branch',
        variant: 'destructive',
      });
    }
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch.id);
    setEditForm({
      branch_code: branch.branch_code,
      branch_title: branch.branch_title ?? '',
    });
  };

  const handleSaveEdit = async (branchId: string) => {
    // Validate branch_code not empty
    if (!editForm.branch_code || editForm.branch_code.trim() === '') {
      toast({
        title: 'Error',
        description: 'Branch code is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.updateBranch(branchId, {
        branch_name: editForm.branch_code.trim(),
        subject_code: editForm.branch_code.trim(),
        subject_title: editForm.branch_title.trim() || '',
      });
      toast({
        title: 'Success',
        description: 'Branch updated successfully',
      });
      setEditingBranch(null);
      fetchBranches();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update branch',
        variant: 'destructive',
      });
    }
  };

  const handleToggleSelection = (branchId: string) => {
    setSelectedBranches((prev) => {
      const clone = new Set(prev);
      if (clone.has(branchId)) clone.delete(branchId);
      else clone.add(branchId);
      return clone;
    });
  };

  const handleDone = async () => {
    if (selectedBranches.size === 0) {
      toast({
        title: 'Warning',
        description: 'No branches selected',
        variant: 'destructive',
      });
      return;
    }

    const selectedData: { [branch: string]: string[] } = {};
    const selectedSubjects: { [branch: string]: { subject: string; subjectTitle: string } } = {};

    // gather roll numbers (as arrays) keyed by branch_code (header)
    branches
      .filter((b) => selectedBranches.has(b.id))
      .forEach((branch) => {
        const branchStudents = students[branch.id] || [];
        selectedData[branch.branch_code] = branchStudents.map((s) => s.roll_number);
        selectedSubjects[branch.branch_code] = {
          subject: branch.branch_code,
          subjectTitle: branch.branch_title || '',
        };
      });

    // navigate back to main page and pass selected branch data in state
    navigate('/exam-seating', {
      state: {
        databaseBranches: selectedData,
        databaseSubjects: selectedSubjects,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/landing')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Database Management
            </h1>
          </div>
          <Button onClick={handleDone} size="lg">
            Done
          </Button>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Upload Branch Data</CardTitle>
            <CardDescription>Upload an Excel file where first row contains branch codes/titles, and each column under a header contains roll numbers.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="branch-file">Excel File</Label>
                <Input
                  id="branch-file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Template example first row: <code>CS - Computer Science</code> <code>ME - Mechanical</code>. Beneath each header put roll numbers one per cell.
                </p>
              </div>
              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-sm text-muted-foreground text-center">
                    Importing... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Stored Branches</CardTitle>
            <CardDescription>Select branches to use for the current session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {branches.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No branches stored yet. Upload an Excel file to get started.
                </p>
              ) : (
                branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="flex items-center gap-4 p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                  >
                    <Checkbox
                      checked={selectedBranches.has(branch.id)}
                      onCheckedChange={() => handleToggleSelection(branch.id)}
                    />

                    {editingBranch === branch.id ? (
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <Input
                          value={editForm.branch_code}
                          onChange={(e) => setEditForm({ ...editForm, branch_code: e.target.value })}
                          placeholder="Branch Code"
                        />
                        <Input
                          value={editForm.branch_title}
                          onChange={(e) => setEditForm({ ...editForm, branch_title: e.target.value })}
                          placeholder="Branch Title"
                        />
                      </div>
                    ) : (
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{branch.branch_code}{branch.branch_title ? ` — ${branch.branch_title}` : ''}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {branch.student_count} students
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {editingBranch === branch.id ? (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(branch.id)}>
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingBranch(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => handleEditBranch(branch)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteBranch(branch.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

