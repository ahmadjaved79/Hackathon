import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Plus, Trash2 } from 'lucide-react';

interface BranchSubject {
  branch: string;
  subject: string;
  subjectTitle: string;
}

interface SubjectManagerProps {
  availableBranches: string[];
  onSubjectsChange?: (subjects: {[branch: string]: {subject: string, subjectTitle: string}}) => void;
}

export const SubjectManager: React.FC<SubjectManagerProps> = ({ availableBranches, onSubjectsChange }) => {
  const [subjects, setSubjects] = useState<BranchSubject[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>('');
  const [subjectTitle, setSubjectTitle] = useState<string>('');
  const { toast } = useToast();

  // No useEffect to load from localStorage - memory only

  const saveSubjects = (newSubjects: BranchSubject[]) => {
    setSubjects(newSubjects);
    
    // Convert to object format and notify parent
    if (onSubjectsChange) {
      const subjectsObj = newSubjects.reduce((acc, s) => {
        acc[s.branch] = { subject: s.subject, subjectTitle: s.subjectTitle };
        return acc;
      }, {} as {[branch: string]: {subject: string, subjectTitle: string}});
      onSubjectsChange(subjectsObj);
    }
  };

  const handleAddSubject = () => {
    if (!selectedBranch || !subjectName.trim() || !subjectTitle.trim()) {
      toast({
        title: "Error",
        description: "Please select a branch and enter both subject code and title",
        variant: "destructive",
      });
      return;
    }

    const newSubjects = subjects.filter(s => s.branch !== selectedBranch);
    newSubjects.push({
      branch: selectedBranch,
      subject: subjectName.trim(),
      subjectTitle: subjectTitle.trim()
    });

    saveSubjects(newSubjects);
    setSelectedBranch('');
    setSubjectName('');
    setSubjectTitle('');
    
    toast({
      title: "Success",
      description: `Subject added for ${selectedBranch}`,
    });
  };

  const handleDeleteSubject = (branch: string) => {
    const newSubjects = subjects.filter(s => s.branch !== branch);
    saveSubjects(newSubjects);
    
    toast({
      title: "Success",
      description: "Subject deleted successfully",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Subject Management
        </CardTitle>
        <CardDescription>
          Assign subjects to each branch for exam scheduling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {availableBranches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Subject Code (e.g., CS301)"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Subject Title (e.g., Data Structures)"
              value={subjectTitle}
              onChange={(e) => setSubjectTitle(e.target.value)}
            />
            
            <Button 
              onClick={handleAddSubject}
              disabled={!selectedBranch || !subjectName.trim() || !subjectTitle.trim()}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          </div>
        </div>

        {subjects.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Current Subjects:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {subjects.map((subject) => (
                <div key={subject.branch} className="flex items-center justify-between p-3 border rounded-lg bg-card/50">
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-1">{subject.branch}</Badge>
                    <p className="text-sm font-medium">{subject.subject}</p>
                    <p className="text-xs text-muted-foreground">{subject.subjectTitle}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSubject(subject.branch)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};