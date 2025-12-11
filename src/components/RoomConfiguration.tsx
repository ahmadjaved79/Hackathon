import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Room } from './ExamSeatingTool';

interface RoomConfigurationProps {
  rooms: Room[];
  onRoomToggle: (roomId: string) => void;
}

export const RoomConfiguration: React.FC<RoomConfigurationProps> = ({ rooms, onRoomToggle }) => {
  const selectedRooms = rooms.filter(room => room.selected);
  const totalCapacity = selectedRooms.reduce((sum, room) => sum + (room.rows * room.columns), 0);

  const mainBlockRooms = rooms.filter(room => room.block === 'Main Block');
  const newBlockRooms = rooms.filter(room => room.block === 'New Block');

  const selectedMainBlock = mainBlockRooms.filter(room => room.selected);
  const selectedNewBlock = newBlockRooms.filter(room => room.selected);

  const mainBlockCapacity = selectedMainBlock.reduce((sum, room) => sum + (room.rows * room.columns), 0);
  const newBlockCapacity = selectedNewBlock.reduce((sum, room) => sum + (room.rows * room.columns), 0);

  const RoomSection = ({ title, rooms, emoji }: { title: string; rooms: Room[]; emoji: string }) => (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm flex items-center gap-2">
        <span>{emoji}</span>
        {title}
        <Badge variant="outline" className="text-xs">
          {rooms.filter(r => r.selected).length}/{rooms.length}
        </Badge>
      </h4>
      <div className="grid gap-2">
        {rooms.map((room) => (
          <div
            key={room.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              room.selected 
                ? 'bg-primary/5 border-primary' 
                : 'bg-muted/50 border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Checkbox
                id={room.id}
                checked={room.selected}
                onCheckedChange={() => onRoomToggle(room.id)}
              />
              <label 
                htmlFor={room.id}
                className="font-medium cursor-pointer"
              >
                {room.name}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {room.rows} × {room.columns}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {room.rows * room.columns} seats
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-academic-purple">🏫</span>
          Room Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RoomSection title="Main Block" rooms={mainBlockRooms} emoji="🏢" />
        <RoomSection title="New Block" rooms={newBlockRooms} emoji="🆕" />

        <div className="pt-4 border-t space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Main Block:</span>
                <div className="flex gap-1">
                  <Badge variant="outline">{selectedMainBlock.length} rooms</Badge>
                  <Badge variant="secondary">{mainBlockCapacity} seats</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">New Block:</span>
                <div className="flex gap-1">
                  <Badge variant="outline">{selectedNewBlock.length} rooms</Badge>
                  <Badge variant="secondary">{newBlockCapacity} seats</Badge>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Total Selected:</span>
                <Badge variant="default">{selectedRooms.length} rooms</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Total Capacity:</span>
                <Badge variant="default" className="bg-[hsl(var(--branch-color-2))] text-white"
                  >
                  {totalCapacity} seats
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
