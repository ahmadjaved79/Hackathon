import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SeatingArrangement } from './ExamSeatingTool';
import { downloadSingleRoomPDF } from '../utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';

interface SeatingDisplayProps {
  arrangements: SeatingArrangement[];
  examDate: string;
  examTitle: string;
  examStartTime?: string;
  examEndTime?: string;
  subjects?: {[branch: string]: {subject: string, subjectTitle: string}};
  isAutonomous: boolean;
}

export const SeatingDisplay: React.FC<SeatingDisplayProps> = ({ arrangements, examDate, examTitle, examStartTime = '', examEndTime = '', subjects = {} ,isAutonomous = false}) => {
  const { toast } = useToast();

  const handleDownloadRoom = async (arrangement: SeatingArrangement) => {
    try {
      await downloadSingleRoomPDF(arrangement, examDate, examTitle, examStartTime, examEndTime, subjects, isAutonomous);
      toast({
        title: "PDF downloaded",
        description: `${arrangement.roomName} seating arrangement downloaded.`
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Error generating PDF file.",
        variant: "destructive"
      });
    }
  };


  const getBranchColor = (branch: string) => {
    const colors = [
      'bg-[hsl(var(--branch-color-1))] text-white',
      'bg-[hsl(var(--branch-color-2))] text-white', 
      'bg-[hsl(var(--branch-color-3))] text-white',
      'bg-[hsl(var(--branch-color-4))] text-white',
      'bg-[hsl(var(--branch-color-5))] text-white',
      'bg-[hsl(var(--branch-color-6))] text-white',
      'bg-[hsl(var(--branch-color-7))] text-white',
      'bg-[hsl(var(--branch-color-8))] text-white',
      'bg-[hsl(var(--branch-color-9))] text-white',
      'bg-[hsl(var(--branch-color-10))] text-white',
      'bg-[hsl(var(--branch-color-11))] text-white',
      'bg-[hsl(var(--branch-color-12))] text-white',
    ];
    const hash = branch.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Seating Arrangements</h2>
        <p className="text-muted-foreground mb-4">
          Generated seating arrangements for {arrangements.length} rooms
        </p>
      </div>

      {arrangements.map((arrangement, index) => (
        <Card key={arrangement.roomId} className="overflow-hidden shadow-[var(--elegant-shadow)] hover:shadow-[var(--hover-lift)] transition-all duration-300 backdrop-blur-sm border-[var(--glass-border)]">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 backdrop-blur-md">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{arrangement.roomName}</CardTitle>
                <div className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Anti-Cheating Layout Applied • Pattern #{(index % 4) + 1}
                </div>
              </div>
              <Button 
                onClick={() => handleDownloadRoom(arrangement)}
                variant="outline"
                size="sm"
              >
                Download PDF
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              {Object.entries(arrangement.branchCounts).map(([branch, count]) => (
                <Badge key={branch} className={`${getBranchColor(branch)} shadow-sm hover:scale-105 transition-transform duration-200`}>
                  {branch}: {count}
                </Badge>
              ))}
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border/50 rounded-lg overflow-hidden backdrop-blur-sm">
                <tbody>
                  {arrangement.students.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((student, colIndex) => (
                        <td 
                          key={colIndex}
                          className="border border-border/30 p-3 text-center min-w-[120px] h-16 hover:bg-secondary/30 transition-colors duration-200"
                        >
                          {student ? (
                            <div className="space-y-1 hover:scale-105 transition-transform duration-200">
                              <div className="font-medium text-sm bg-background/60 px-2 py-0.5 rounded text-foreground">{student.roll}</div>
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${getBranchColor(student.branch)} shadow-sm hover:shadow-md transition-shadow duration-200`}
                              >
                                {student.branch}
                              </Badge>
                            </div>
                          ) : (
                            <div className="text-muted-foreground/60 text-xs bg-muted/20 rounded py-1">Empty</div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 text-xs text-muted-foreground text-center bg-secondary/30 py-2 rounded-md backdrop-blur-sm">
              <span className="font-medium">Seat Layout:</span> {arrangement.students.length} rows × {arrangement.students[0]?.length || 0} columns 
              <span className="mx-2">•</span>
              <span className="font-medium">Total Capacity:</span> {arrangement.students.length * (arrangement.students[0]?.length || 0)}
              <span className="mx-2">•</span>
              <span className="font-medium">Occupied:</span> {Object.values(arrangement.branchCounts).reduce((a, b) => a + b, 0)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
