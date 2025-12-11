import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings2, Sliders } from 'lucide-react';
import { AllocationMode } from './ExamSeatingTool';

interface AllocationModeSelectorProps {
  allocationMode: AllocationMode;
  onAllocationModeChange: (mode: AllocationMode) => void;
  maxRoomCapacity: number;
}

export const AllocationModeSelector: React.FC<AllocationModeSelectorProps> = ({
  allocationMode,
  onAllocationModeChange,
  maxRoomCapacity
}) => {
  const handleModeChange = (type: 'even' | 'customised') => {
    if (type === 'even') {
      onAllocationModeChange({ type: 'even', evenType: 'max' });
    } else {
      onAllocationModeChange({ type: 'customised' });
    }
  };

  const handleEvenTypeChange = (evenType: 'default' | 'max' | 'custom') => {
    onAllocationModeChange({ 
      type: 'even', 
      evenType,
      customNumber: evenType === 'custom' ? 24 : undefined
    });
  };

  const handleCustomNumberChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      onAllocationModeChange({
        ...allocationMode,
        customNumber: num
      });
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-card/95 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          Allocation Mode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={allocationMode.type} onValueChange={handleModeChange}>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="even" id="even" />
              <Label htmlFor="even" className="font-medium">Even Alignment</Label>
            </div>
            
            {allocationMode.type === 'even' && (
              <div className="ml-6 space-y-4 p-4 bg-muted/30 rounded-lg border border-border/30">
                <Select 
                  value={allocationMode.evenType} 
                  onValueChange={handleEvenTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select allocation strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">
                      <div className="flex items-center gap-2">
                        <span>24 Students per Room</span>
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="max">
                      <div className="flex items-center gap-2">
                        <span>Maximum Allocation</span>
                        <Badge variant="outline" className="text-xs">Fill rooms</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <span>Custom Number</span>
                        <Badge variant="outline" className="text-xs">User defined</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {allocationMode.evenType === 'custom' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Students per room</Label>
                    <Input
                      type="number"
                      min="1"
                      max={maxRoomCapacity}
                      value={allocationMode.customNumber || ''}
                      onChange={(e) => handleCustomNumberChange(e.target.value)}
                      placeholder="Enter number of students"
                      className="max-w-xs"
                    />
                    {allocationMode.customNumber && allocationMode.customNumber > maxRoomCapacity && (
                      <p className="text-destructive text-sm">
                        ⚠️ Cannot exceed maximum room capacity of {maxRoomCapacity}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="customised" id="customised" />
              <Label htmlFor="customised" className="font-medium flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                Customised Alignment
              </Label>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
