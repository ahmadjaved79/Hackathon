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
    <Card className="w-full bg-[linear-gradient(180deg,#fbf6ef,#f4ead2)] border border-[rgba(0,0,0,0.04)] shadow-md rounded-2xl">
      <CardHeader className="px-6 py-4">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-[#2b4a3a]">
          <Settings2 className="h-5 w-5 text-[#8aa67a]" />
          <span>Allocation Mode</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-6 py-4 space-y-6">
        <RadioGroup value={allocationMode.type} onValueChange={handleModeChange}>
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <RadioGroupItem value="even" id="even" className="ring-0" />
              <Label htmlFor="even" className="text-[#345d45] font-medium">Even Alignment</Label>
            </div>

            {allocationMode.type === 'even' && (
              <div className="ml-6 p-4 bg-[rgba(255,255,255,0.7)] rounded-lg border border-[rgba(0,0,0,0.03)] shadow-sm">
                <div className="mb-3">
                  <Select 
                    value={allocationMode.evenType} 
                    onValueChange={handleEvenTypeChange}
                  >
                    <SelectTrigger className="w-full bg-white border border-[rgba(0,0,0,0.06)]">
                      <SelectValue placeholder="Select allocation strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default" className="flex items-center justify-between gap-2 py-2">
                        <span>24 Students per Room</span>
                        <Badge variant="secondary" className="bg-[#f7d6a7] text-[#6b3f00] text-xs">Default</Badge>
                      </SelectItem>
                      <SelectItem value="max" className="flex items-center justify-between gap-2 py-2">
                        <span>Maximum Allocation</span>
                        <Badge variant="outline" className="text-xs">Fill rooms</Badge>
                      </SelectItem>
                      <SelectItem value="custom" className="flex items-center justify-between gap-2 py-2">
                        <span>Custom Number</span>
                        <Badge variant="outline" className="text-xs">User defined</Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {allocationMode.evenType === 'custom' && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-[#2f4f3b]">Students per room</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={1}
                        max={maxRoomCapacity}
                        value={allocationMode.customNumber || ''}
                        onChange={(e) => handleCustomNumberChange(e.target.value)}
                        placeholder="Enter number"
                        className="max-w-[120px] bg-white border border-[rgba(0,0,0,0.06)]"
                      />
                      <div className="text-xs text-[#556b59]">
                        Max: <strong>{maxRoomCapacity}</strong>
                      </div>
                    </div>

                    {allocationMode.customNumber && allocationMode.customNumber > maxRoomCapacity && (
                      <p className="text-destructive text-sm">
                        ⚠️ Cannot exceed maximum room capacity of {maxRoomCapacity}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <RadioGroupItem value="customised" id="customised" className="ring-0" />
              <Label htmlFor="customised" className="font-medium flex items-center gap-2 text-[#345d45]">
                <Sliders className="h-4 w-4 text-[#8aa67a]" />
                Customised Alignment
              </Label>
            </div>
          </div>
        </RadioGroup>

        <div className="mt-2 text-sm text-[#496251]">
          <p className="font-medium">Note</p>
          <p className="text-xs">Choose "Even Alignment" to distribute students evenly across rooms. Use "Customised" for manual control per-room.</p>
        </div>
      </CardContent>
    </Card>
  );
};
