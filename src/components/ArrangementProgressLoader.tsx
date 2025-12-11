import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Users, MapPin, CheckCircle2 } from 'lucide-react';

interface ArrangementProgressLoaderProps {
  isVisible: boolean;
  progress: number;
  currentStep: string;
  studentsProcessed: number;
  totalStudents: number;
  roomsCompleted: number;
  totalRooms: number;
}

export const ArrangementProgressLoader: React.FC<ArrangementProgressLoaderProps> = ({
  isVisible,
  progress,
  currentStep,
  studentsProcessed,
  totalStudents,
  roomsCompleted,
  totalRooms
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 shadow-[var(--elegant-shadow)] border-[var(--glass-border)] backdrop-blur-md">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Main loading animation */}
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary to-accent p-1 animate-spin">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>
              
              {/* Floating particles animation */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-2 left-4 w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="absolute top-6 right-6 w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="absolute bottom-4 left-8 w-1 h-1 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: '0.6s' }}></div>
              </div>
            </div>

            {/* Progress title */}
            <div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Generating Seating Arrangement
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {currentStep}
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-primary">{Math.round(progress)}%</span>
              </div>
              <Progress 
                value={progress} 
                className="h-3 bg-secondary/50"
              />
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 backdrop-blur-sm">
                <Users className="w-4 h-4 text-primary" />
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">Students</div>
                  <div className="text-sm font-medium">
                    {studentsProcessed}/{totalStudents}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 backdrop-blur-sm">
                <MapPin className="w-4 h-4 text-accent" />
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">Rooms</div>
                  <div className="text-sm font-medium">
                    {roomsCompleted}/{totalRooms}
                  </div>
                </div>
              </div>
            </div>

            {/* Completion indicator */}
            {progress >= 100 && (
              <div className="flex items-center justify-center gap-2 text-green-600 animate-fade-in">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Arrangement Complete!</span>
              </div>
            )}

            {/* Animated dots */}
            <div className="flex justify-center gap-1">
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};