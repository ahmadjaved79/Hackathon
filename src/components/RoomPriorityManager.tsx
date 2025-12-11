import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { Room } from '@/components/ExamSeatingTool';

interface RoomPriorityManagerProps {
  rooms: Room[];
  onRoomPriorityChange: (roomId: string, newPriority: number) => void;
}

export const RoomPriorityManager: React.FC<RoomPriorityManagerProps> = ({
  rooms,
  onRoomPriorityChange,
}) => {
  const selectedRooms = rooms.filter(room => room.selected);
  
  // Sort rooms by priority (lower number = higher priority)
  const sortedRooms = [...selectedRooms].sort((a, b) => (a.priority || 999) - (b.priority || 999));

  const moveUp = (roomId: string) => {
    const roomIndex = sortedRooms.findIndex(r => r.id === roomId);
    if (roomIndex > 0) {
      const currentRoom = sortedRooms[roomIndex];
      const aboveRoom = sortedRooms[roomIndex - 1];
      
      // Swap priorities
      onRoomPriorityChange(currentRoom.id, aboveRoom.priority || 0);
      onRoomPriorityChange(aboveRoom.id, currentRoom.priority || 0);
    }
  };

  const moveDown = (roomId: string) => {
    const roomIndex = sortedRooms.findIndex(r => r.id === roomId);
    if (roomIndex < sortedRooms.length - 1) {
      const currentRoom = sortedRooms[roomIndex];
      const belowRoom = sortedRooms[roomIndex + 1];
      
      // Swap priorities
      onRoomPriorityChange(currentRoom.id, belowRoom.priority || 0);
      onRoomPriorityChange(belowRoom.id, currentRoom.priority || 0);
    }
  };

  if (selectedRooms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Room Priority
          </CardTitle>
          <CardDescription>
            No rooms selected. Select rooms to manage their filling priority.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5" />
          Room Priority Management
        </CardTitle>
        <CardDescription>
          Manage the order in which rooms are filled. Higher priority rooms are filled first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedRooms.map((room, index) => (
            <div
              key={room.id}
              className="flex items-center justify-between p-4 border rounded-lg bg-card/50 hover:bg-card/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{room.name}</span>
                    <Badge variant={room.type === 'Seminar Hall' ? 'default' : 'secondary'}>
                      {room.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {room.block} • Capacity: {room.rows * room.columns}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveUp(room.id)}
                  disabled={index === 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveDown(room.id)}
                  disabled={index === sortedRooms.length - 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Seminar halls are automatically given higher priority by default. 
            Use the controls above to customize the filling order.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};