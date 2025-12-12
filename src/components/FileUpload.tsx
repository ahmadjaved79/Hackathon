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
    <div className="w-full px-6 md:px-10 lg:px-16 py-8">
      {/* Outer full-width container with soft background and rounded edges */}
      <div className="w-full bg-white shadow-xl rounded-2xl border border-transparent
                      dark:bg-neutral-900 dark:border-neutral-800
                      p-6 md:p-8 lg:p-10" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          {/* Left: Prominent upload panel */}
          <Card className="flex-1 w-full bg-[linear-gradient(180deg,#fffdf8,#f7efe0)] border-0 shadow-md rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg md:text-xl font-semibold text-slate-800">
                <span className="text-2xl">📊</span>
                <span>Excel Upload</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="rounded-lg p-6 text-center border border-dashed border-transparent
                              bg-white/60 hover:shadow-lg transition-all">
                <div className="text-5xl mb-3">📁</div>
                <p className="text-sm text-slate-600 mb-4">Upload an Excel file containing student roll numbers and branches. We’ll parse and preview them client-side.</p>

                <div className="flex items-center justify-center gap-3">
                  <Button onClick={handleButtonClick} variant="default" className="px-5 py-2 shadow-sm bg-amber-600 hover:bg-amber-500 text-white">
                    Select Excel File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button onClick={() => fileInputRef.current?.click()} variant="ghost" className="px-4 py-2">
                    Browse
                  </Button>
                </div>
              </div>

              <div className="text-sm text-slate-500">
                <p className="font-medium mb-2 text-slate-700">Expected format</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
                  <li>Each column can represent student groups/branches (or upload roll list)</li>
                  <li>Column headers should contain branch names (CSE, ECE, IT, etc.)</li>
                  <li>Cells contain student roll numbers (10 char roll codes)</li>
                  <li>Empty cells will be ignored</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Right: Summary / status */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-[linear-gradient(180deg,#fff,#fbf5ea)] border rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-slate-500">Loaded</div>
                  <div className="text-2xl font-semibold text-slate-800">{studentsCount}</div>
                </div>

                <Badge variant="default" className="bg-amber-600 text-white px-3 py-1 rounded-md">
                  {studentsCount > 0 ? 'Ready' : 'Waiting'}
                </Badge>
              </div>

              <div className="text-xs text-slate-500 mb-2">Quick actions</div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => { if (fileInputRef.current) fileInputRef.current.click(); }} variant="outline" className="text-slate-700">
                  Upload file
                </Button>
                <Button onClick={() => window.location.reload()} variant="ghost" className="text-slate-600">
                  Reset
                </Button>
              </div>
            </div>

            {/* small note */}
            <div className="mt-4 text-xs text-slate-500">
              <strong className="text-slate-700">Tip:</strong> Use Excel lists for fast bulk import. Make sure branch headers are correct for best parsing.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
