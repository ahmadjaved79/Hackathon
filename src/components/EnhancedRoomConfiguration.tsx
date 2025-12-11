import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Room, AllocationMode } from './ExamSeatingTool';
import { Building, AlertTriangle, Edit, Check, X, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedRoomConfigurationProps {
  rooms: Room[];
  onRoomToggle: (roomId: string) => void;
  onCustomAllotmentChange: (roomId: string, allotment: number) => void;
  onRoomDimensionChange: (roomId: string, rows: number, columns: number) => void;
  onRoomsChange: (rooms: Room[]) => void;
  allocationMode: AllocationMode;
  validationErrors: string[];
}

export const EnhancedRoomConfiguration: React.FC<EnhancedRoomConfigurationProps> = ({
  rooms,
  onRoomToggle,
  onCustomAllotmentChange,
  onRoomDimensionChange,
  onRoomsChange,
  allocationMode,
  validationErrors
}) => {
  const { toast } = useToast();
  const [isMasterEditMode, setIsMasterEditMode] = useState(false);
  const [tempRooms, setTempRooms] = useState<Room[]>([]);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    rows: 6,
    columns: 5,
    block: 'Main Block',
    type: 'Classroom' as 'Classroom' | 'Seminar Hall',
    priority: 50
  });

  const handleEnterMasterEdit = () => {
    setTempRooms(JSON.parse(JSON.stringify(rooms)));
    setIsMasterEditMode(true);
  };

  const handleDone = () => {
    onRoomsChange(tempRooms);
    setIsMasterEditMode(false);
    setTempRooms([]);
    toast({
      title: "Success",
      description: "All room changes have been saved.",
    });
  };

  const handleCancel = () => {
    setTempRooms([]);
    setIsMasterEditMode(false);
    setIsAddingRoom(false);
  };

  const handleTempRoomUpdate = (roomId: string, field: keyof Room, value: any) => {
    setTempRooms(prev => prev.map(room => 
      room.id === roomId ? { ...room, [field]: value } : room
    ));
  };

  const handleDeleteRoom = (roomId: string) => {
    const roomToDelete = tempRooms.find(r => r.id === roomId);
    setTempRooms(prev => prev.filter(room => room.id !== roomId));
    toast({
      title: "Room Removed",
      description: `${roomToDelete?.name} will be deleted when you click Done.`,
    });
  };

  const handleAddRoom = () => {
    if (!newRoom.name.trim()) {
      toast({
        title: "Error",
        description: "Room name is required.",
        variant: "destructive",
      });
      return;
    }

    if (tempRooms.some(room => room.name.toLowerCase() === newRoom.name.toLowerCase())) {
      toast({
        title: "Error",
        description: "Room name already exists.",
        variant: "destructive",
      });
      return;
    }

    const newId = (Math.max(...tempRooms.map(r => parseInt(r.id)), 0) + 1).toString();
    const roomToAdd: Room = {
      id: newId,
      name: newRoom.name.trim(),
      rows: newRoom.rows,
      columns: newRoom.columns,
      selected: false,
      block: newRoom.block,
      type: newRoom.type,
      priority: newRoom.priority
    };

    setTempRooms(prev => [...prev, roomToAdd]);
    setNewRoom({
      name: '',
      rows: 6,
      columns: 5,
      block: 'Main Block',
      type: 'Classroom',
      priority: 50
    });
    setIsAddingRoom(false);
    toast({
      title: "Room Added",
      description: `${roomToAdd.name} will be added when you click Done.`,
    });
  };

  const activeRooms = isMasterEditMode ? tempRooms : rooms;
  const getExpectedAllotment = (room: Room) => {
    if (room.type === 'Seminar Hall') {
      return room.customAllotment || 24;
    }
    
    if (allocationMode.type === 'customised') {
      return room.customAllotment || 24;
    }
    
    if (allocationMode.evenType === 'default') return 24;
    if (allocationMode.evenType === 'max') return room.rows * room.columns;
    if (allocationMode.evenType === 'custom') return allocationMode.customNumber || 0;
    
    return 0;
  };

  const selectedRooms = activeRooms.filter(room => room.selected);
  const totalCapacity = selectedRooms.reduce((sum, room) => {
    const expectedAllotment = getExpectedAllotment(room);
    return sum + expectedAllotment;
  }, 0);

  const mainBlockClassrooms = activeRooms.filter(room => room.block === 'Main Block' && room.type === 'Classroom');
  const mainBlockSeminarHalls = activeRooms.filter(room => room.block === 'Main Block' && room.type === 'Seminar Hall');
  const newBlockClassrooms = activeRooms.filter(room => room.block === 'New Block' && room.type === 'Classroom');
  const newBlockSeminarHalls = activeRooms.filter(room => room.block === 'New Block' && room.type === 'Seminar Hall');

  const hasValidationError = (roomId: string) => {
    return validationErrors.some(error => error.includes(roomId));
  };

  const RoomSubSection = ({ title, rooms, emoji }: { title: string; rooms: Room[]; emoji: string }) => {
    if (rooms.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <h5 className="font-medium text-sm flex items-center gap-2 text-muted-foreground">
          <span>{emoji}</span>
          {title}
          <Badge variant="outline" className="text-xs">
            {rooms.filter(r => r.selected).length}/{rooms.length}
          </Badge>
        </h5>
        <div className="grid gap-2 ml-4">
          {rooms.map((room) => {
            const hasError = hasValidationError(room.id);
            const expectedAllotment = getExpectedAllotment(room);
            const capacity = room.rows * room.columns;
            const exceedsCapacity = expectedAllotment > capacity;
            
            if (isMasterEditMode) {
              return (
                <div
                  key={room.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Room Name</Label>
                        <Input
                          value={room.name}
                          onChange={(e) => handleTempRoomUpdate(room.id, 'name', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Block</Label>
                        <Select 
                          value={room.block} 
                          onValueChange={(value) => handleTempRoomUpdate(room.id, 'block', value)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Main Block">Main Block</SelectItem>
                            <SelectItem value="New Block">New Block</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">Rows</Label>
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          value={room.rows}
                          onChange={(e) => handleTempRoomUpdate(room.id, 'rows', parseInt(e.target.value) || 1)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Columns</Label>
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          value={room.columns}
                          onChange={(e) => handleTempRoomUpdate(room.id, 'columns', parseInt(e.target.value) || 1)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select 
                          value={room.type} 
                          onValueChange={(value: 'Classroom' | 'Seminar Hall') => handleTempRoomUpdate(room.id, 'type', value)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Classroom">Classroom</SelectItem>
                            <SelectItem value="Seminar Hall">Seminar Hall</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Priority</Label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={room.priority}
                          onChange={(e) => handleTempRoomUpdate(room.id, 'priority', parseInt(e.target.value) || 1)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteRoom(room.id)}
                    className="mt-6"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            }
            
            return (
              <div
                key={room.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                  hasError || exceedsCapacity
                    ? 'bg-destructive/10 border-destructive shadow-md' 
                    : room.selected 
                    ? 'bg-primary/5 border-primary/60 shadow-sm' 
                    : 'bg-muted/30 border-border/50 hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={room.id}
                    checked={room.selected}
                    onCheckedChange={() => onRoomToggle(room.id)}
                  />
                  <div className="space-y-1">
                    <label 
                      htmlFor={room.id}
                      className="font-medium cursor-pointer flex items-center gap-2"
                    >
                      {room.name}
                      {(hasError || exceedsCapacity) && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                     </label>
                     {room.selected && (
                       <div className="space-y-2">
                         <div className="flex items-center gap-2">
                           <Label htmlFor={`rows-${room.id}`} className="text-xs text-muted-foreground">
                             Rows:
                           </Label>
                            <Input
                              id={`rows-${room.id}`}
                              type="number"
                              min="1"
                              max="20"
                              value={room.rows || ''}
                              onChange={(e) => onRoomDimensionChange(room.id, parseInt(e.target.value) || 1, room.columns)}
                              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                              className="w-16 h-7 text-xs"
                              placeholder="1"
                            />
                           <Label htmlFor={`columns-${room.id}`} className="text-xs text-muted-foreground">
                             Columns:
                           </Label>
                            <Input
                              id={`columns-${room.id}`}
                              type="number"
                              min="1"
                              max="20"
                              value={room.columns || ''}
                              onChange={(e) => onRoomDimensionChange(room.id, room.rows, parseInt(e.target.value) || 1)}
                              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                              className="w-16 h-7 text-xs"
                              placeholder="1"
                            />
                         </div>
                         {(room.type === 'Seminar Hall' || allocationMode.type === 'customised') && (
                           <div className="flex items-center gap-2">
                             <Label htmlFor={`allotment-${room.id}`} className="text-xs text-muted-foreground">
                               {room.type === 'Seminar Hall' ? 'Required Allotment:' : 'Allotment:'}
                             </Label>
                              <Input
                                id={`allotment-${room.id}`}
                                type="number"
                                min="0"
                                max={room.rows * room.columns}
                                value={room.customAllotment || 24 }
                                onChange={(e) => onCustomAllotmentChange(room.id, parseInt(e.target.value) || 0)}
                                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                                className={`w-20 h-7 text-xs ${
                                  room.type === 'Seminar Hall' && (!room.customAllotment || room.customAllotment === 0 || room.customAllotment > (room.rows * room.columns)) 
                                    ? 'border-destructive' 
                                    : ''
                                }`}
                                placeholder="0"
                                required={room.type === 'Seminar Hall'}
                              />
                             {room.type === 'Seminar Hall' && (!room.customAllotment || room.customAllotment === 0) && (
                               <AlertTriangle className="h-3 w-3 text-destructive" />
                             )}
                             {room.type === 'Seminar Hall' && room.customAllotment && room.customAllotment > (room.rows * room.columns) && (
                               <span className="text-xs text-destructive">Exceeds capacity!</span>
                             )}
                           </div>
                         )}
                       </div>
                     )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {room.rows} × {room.columns}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {capacity} seats
                  </Badge>
                  {room.selected && (room.type !== 'Seminar Hall' && allocationMode.type !== 'customised') && (
                    <Badge 
                      variant={exceedsCapacity ? "destructive" : "default"} 
                      className="text-xs"
                    >
                      {expectedAllotment} allotted
                    </Badge>
                  )}
                  {room.selected && room.type === 'Seminar Hall' && room.customAllotment && (
                    <Badge 
                      variant={room.customAllotment > capacity ? "destructive" : "default"} 
                      className="text-xs"
                    >
                      {room.customAllotment} allotted
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const BlockSection = ({ title, classrooms, seminarHalls, emoji }: { 
    title: string; 
    classrooms: Room[]; 
    seminarHalls: Room[];
    emoji: string;
  }) => (
    <div className="space-y-4">
      <h4 className="font-semibold text-base flex items-center gap-2">
        <span>{emoji}</span>
        {title}
        <Badge variant="outline" className="text-xs">
          {[...classrooms, ...seminarHalls].filter(r => r.selected).length}/{classrooms.length + seminarHalls.length}
        </Badge>
      </h4>
      <div className="space-y-4 ml-2">
        <RoomSubSection title="Classrooms" rooms={classrooms} emoji="🏫" />
        <RoomSubSection title="Seminar Halls" rooms={seminarHalls} emoji="🎓" />
      </div>
    </div>
  );

  return (
    <Card className="backdrop-blur-sm bg-card/95 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Room Configuration
          </div>
          <Button
            variant={isMasterEditMode ? "default" : "outline"}
            size="sm"
            onClick={isMasterEditMode ? handleCancel : handleEnterMasterEdit}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isMasterEditMode ? "Exit Edit Mode" : "Master Edit"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isMasterEditMode && (
          <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Master Edit Mode Active</p>
                <p className="text-sm text-muted-foreground">Make changes to all rooms. Changes are temporary until you click Done.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingRoom(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDone}
              >
                <Check className="h-4 w-4 mr-2" />
                Done
              </Button>
            </div>
          </div>
        )}

        {isAddingRoom && (
          <div className="p-4 bg-card border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Add New Room</h4>
              <Button size="sm" variant="ghost" onClick={() => setIsAddingRoom(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Room Name</Label>
                <Input
                  value={newRoom.name}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., 101, SH1"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Block</Label>
                <Select value={newRoom.block} onValueChange={(value) => setNewRoom(prev => ({ ...prev, block: value }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Main Block">Main Block</SelectItem>
                    <SelectItem value="New Block">New Block</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-xs">Rows</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={newRoom.rows}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, rows: parseInt(e.target.value) || 1 }))}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Columns</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={newRoom.columns}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, columns: parseInt(e.target.value) || 1 }))}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={newRoom.type} onValueChange={(value: 'Classroom' | 'Seminar Hall') => setNewRoom(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Classroom">Classroom</SelectItem>
                    <SelectItem value="Seminar Hall">Seminar Hall</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Priority</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={newRoom.priority}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                  className="h-8"
                />
              </div>
            </div>
            <Button size="sm" onClick={handleAddRoom} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </div>
        )}
        {validationErrors.length > 0 && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive font-medium text-sm mb-2">
              <AlertTriangle className="h-4 w-4" />
              Validation Errors
            </div>
            <ul className="text-sm text-destructive space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <BlockSection 
          title="Main Block" 
          classrooms={mainBlockClassrooms} 
          seminarHalls={mainBlockSeminarHalls}
          emoji="🏢"
        />

        <BlockSection 
          title="New Block" 
          classrooms={newBlockClassrooms} 
          seminarHalls={newBlockSeminarHalls}
          emoji="🆕"
        />

        <div className="pt-4 border-t space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Selected Rooms:</span>
                <Badge variant="default">{selectedRooms.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Allotted:</span>
                <Badge variant="default" className="bg-primary/80">
                  {totalCapacity} students
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Classrooms:</span>
                <Badge variant="outline">
                  {[...mainBlockClassrooms, ...newBlockClassrooms].filter(r => r.selected).length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Seminar Halls:</span>
                <Badge variant="outline">
                  {[...mainBlockSeminarHalls, ...newBlockSeminarHalls].filter(r => r.selected).length}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
