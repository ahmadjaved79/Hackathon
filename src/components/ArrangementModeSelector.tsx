import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shuffle, Brain } from 'lucide-react';

export type ArrangementMode = 'simple' | 'complex';

interface ArrangementModeSelectorProps {
  arrangementMode: ArrangementMode;
  onArrangementModeChange: (mode: ArrangementMode) => void;
}

export const ArrangementModeSelector: React.FC<ArrangementModeSelectorProps> = ({
  arrangementMode,
  onArrangementModeChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Arrangement Mode
        </CardTitle>
        <CardDescription>
          Choose the seating arrangement algorithm
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={arrangementMode} onValueChange={(value) => onArrangementModeChange(value as ArrangementMode)}>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="simple" id="simple" />
              <Label htmlFor="simple" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <Shuffle className="h-4 w-4" />
                  <span className="font-medium">Simple Arrangement</span>
                  <Badge variant="secondary" className="text-xs">Fast</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Students from the same branch are seated column-wise. If students exceed one column, they continue into the next column.
                </p>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="complex" id="complex" />
              <Label htmlFor="complex" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="h-4 w-4" />
                  <span className="font-medium">Complex Arrangement</span>
                  <Badge variant="default" className="text-xs">Anti-Cheating</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Advanced anti-cheating algorithm that ensures students from the same branch are not seated adjacent to each other.
                </p>
              </Label>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};