import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, Eye, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Room } from '@/utils/seatingLogic';

interface InvigilatorAssignment {
  [roomName: string]: string[];
}

export default function Invigilators() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const rooms: Room[] = location.state?.rooms || [];
  const [invigilators, setInvigilators] = useState<string[]>([]);
  const [roomRequirements, setRoomRequirements] = useState<{ [roomName: string]: number }>(
    rooms.reduce((acc, room) => ({ ...acc, [room.name]: 2 }), {})
  );
  const [assignment, setAssignment] = useState<InvigilatorAssignment | null>(null);
  const [unassigned, setUnassigned] = useState<string[]>([]);

  // 🔹 Fisher-Yates Shuffle
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // 🔹 Handle Excel upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // ✅ Restrict to first column only
        const names = jsonData
          .map((row) => row[0])
          .filter((name) => typeof name === 'string' && name.trim().length > 0)
          .map((name) => name.trim());

        setInvigilators(names);
        toast({
          title: 'Success',
          description: `Loaded ${names.length} invigilators`,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to read Excel file',
          variant: 'destructive',
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 🔹 Preview assignment
  const handlePreviewAssignment = () => {
    if (invigilators.length === 0) {
      toast({
        title: 'Error',
        description: 'Please upload invigilators first',
        variant: 'destructive',
      });
      return;
    }

    const totalRequired = Object.values(roomRequirements).reduce((sum, count) => sum + count, 0);
    const shuffled = shuffleArray(invigilators);

    const newAssignment: InvigilatorAssignment = {};
    let currentIndex = 0;

    rooms.forEach((room) => {
      const required = roomRequirements[room.name] || 0;
      newAssignment[room.name] = shuffled.slice(currentIndex, currentIndex + required);
      currentIndex += required;
    });

    const unassignedInvigilators = shuffled.slice(currentIndex);
    setAssignment(newAssignment);
    setUnassigned(unassignedInvigilators);

    if (totalRequired > invigilators.length) {
      toast({
        title: 'Warning',
        description: `Shortage: ${totalRequired - invigilators.length} invigilators needed`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Assignment preview generated',
      });
    }
  };

  // 🔹 Confirm & download Excel
  const handleConfirm = () => {
    if (!assignment) {
      toast({
        title: 'Error',
        description: 'Please preview assignment first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const wsData: any[][] = [['Room Name', 'Invigilator']];
      for (const room of rooms) {
        const invs = assignment[room.name] || [];
        if (invs.length > 0) {
          invs.forEach((inv) => wsData.push([room.name, inv]));
        } else {
          wsData.push([room.name, '---']);
        }
      }

      if (unassigned.length > 0) {
        wsData.push([], ['Unassigned Invigilators']);
        unassigned.forEach((inv) => wsData.push(['', inv]));
      }

      const worksheet = XLSX.utils.aoa_to_sheet(wsData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Invigilator Assignment');

      XLSX.writeFile(workbook, 'Invigilator_Assignment.xlsx');

      toast({
        title: 'Success',
        description: 'Invigilator assignment downloaded successfully',
      });

      // Optionally navigate home
      // navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate download file',
        variant: 'destructive',
      });
    }
  };

  // 🔹 Guard: No rooms passed
  if (rooms.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive font-semibold mb-4">No room data found.</p>
        <Button onClick={() => navigate('/')}>Go Back</Button>
      </div>
    );
  }

  // 🔹 Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Invigilator Management</h1>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Invigilators</CardTitle>
            <CardDescription>Upload an Excel file with invigilator names (first column only)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="invigilator-file">Excel File</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="invigilator-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                  />
                  <Button variant="outline" size="icon" disabled={!invigilators.length}>
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {invigilators.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold">Loaded: {invigilators.length} invigilators</p>
                  <p className="text-sm text-muted-foreground">
                    Total needed: {Object.values(roomRequirements).reduce((a, b) => a + b, 0)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Room Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Room Requirements</CardTitle>
            <CardDescription>Specify how many invigilators are needed per room</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div key={room.name} className="space-y-2">
                  <Label htmlFor={`room-${room.name}`}>{room.name}</Label>
                  <Input
                    id={`room-${room.name}`}
                    type="number"
                    min="0"
                    value={roomRequirements[room.name] || 0}
                    onChange={(e) =>
                      setRoomRequirements({
                        ...roomRequirements,
                        [room.name]: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assignment Preview */}
        {assignment && (
          <Card>
            <CardHeader>
              <CardTitle>Assignment Preview</CardTitle>
              <CardDescription>Review randomized invigilator assignment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rooms.map((room) => (
                  <div key={room.name} className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">{room.name}</h3>
                    <div className="space-y-1">
                      {assignment[room.name]?.length > 0 ? (
                        assignment[room.name].map((inv, idx) => (
                          <p key={idx} className="text-sm text-muted-foreground">
                            {idx + 1}. {inv}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-destructive">No invigilators assigned</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Unassigned Section */}
                {unassigned.length > 0 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Unassigned Invigilators</h3>
                    {unassigned.map((name, i) => (
                      <p key={i} className="text-sm text-muted-foreground">
                        {name}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Buttons */}
        <div className="flex gap-4">
          <Button onClick={handlePreviewAssignment} className="flex-1">
            <Eye className="mr-2 h-4 w-4" />
            Preview Assignment
          </Button>
          <Button onClick={handleConfirm} variant="default" className="flex-1" disabled={!assignment}>
            <Check className="mr-2 h-4 w-4" />
            Confirm & Download
          </Button>
        </div>
      </div>
    </div>
  );
}
