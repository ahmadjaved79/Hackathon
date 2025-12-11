import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, AlertTriangle } from 'lucide-react';

interface AntiCheatingSummaryProps {
  totalStudents: number;
  totalRooms: number;
}

export const AntiCheatingSummary: React.FC<AntiCheatingSummaryProps> = ({
  totalStudents,
  totalRooms
}) => {
  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
          <Shield className="h-5 w-5" />
          Anti-Cheating Security Features
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Seating Rules Applied
            </h4>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• No same-branch students sit adjacent</li>
              <li>• Advanced checkerboard distribution</li>
              <li>• Random seat assignment within rules</li>
              <li>• 8-directional adjacency checking</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Security Statistics
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-green-700 dark:text-green-300">Students Secured:</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {totalStudents}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700 dark:text-green-300">Rooms Protected:</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {totalRooms}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700 dark:text-green-300">Cheating Risk:</span>
                <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  Minimized
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-2 border-t border-green-200 dark:border-green-800">
          <p className="text-xs text-green-600 dark:text-green-400">
            <strong>Algorithm:</strong> Advanced 8-directional anti-cheating placement with branch mixing and randomization
          </p>
        </div>
      </CardContent>
    </Card>
  );
};