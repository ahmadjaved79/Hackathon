import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  studentsCount: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, studentsCount }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        onFileUpload(file);
      } else {
        alert('Please select a valid Excel file (.xlsx or .xls)');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-academic-green">📊</span>
          Excel Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
          <div className="text-4xl mb-2">📁</div>
          <p className="text-sm text-muted-foreground mb-4">
            Upload Excel file with student data
          </p>
          <Button onClick={handleButtonClick} variant="outline">
            Select Excel File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">Expected format:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Each column represents a branch</li>
            <li>Column headers should contain branch names</li>
            <li>Cells contain student roll numbers</li>
            <li>Empty cells will be ignored</li>
          </ul>
        </div>

        {studentsCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-[hsl(var(--branch-color-2))] text-white"
              >
              ✅ {studentsCount} students loaded
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
