import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Room } from './ExamSeatingTool';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MasterEditProps {
  rooms: Room[];
  onRoomsChange: (rooms: Room[]) => void;
}

export const MasterEdit: React.FC<MasterEditProps> = ({ rooms, onRoomsChange }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [newRoom, setNewRoom] = useState({
    name: '',
    rows: 6,
    columns: 5,
    block: 'Main Block',
    type: 'Classroom' as 'Classroom' | 'Seminar Hall',
    priority: 50
  });
  const { toast } = useToast();

  const handleAddRoom = () => {
    if (!newRoom.name.trim()) {
      toast({
        title: "Error",
        description: "Room name is required.",
        variant: "destructive",
      });
      return;
    }

    // Check if room name already exists
    if (rooms.some(room => room.name.toLowerCase() === newRoom.name.toLowerCase())) {
      toast({
        title: "Error",
        description: "Room name already exists.",
        variant: "destructive",
      });
      return;
    }

    const newId = (Math.max(...rooms.map(r => parseInt(r.id))) + 1).toString();
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

    onRoomsChange([...rooms, roomToAdd]);
    setNewRoom({
      name: '',
      rows: 6,
      columns: 5,
      block: 'Main Block',
      type: 'Classroom',
      priority: 50
    });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Success",
      description: `Room ${roomToAdd.name} added successfully.`,
    });
  };

  const handleEditRoom = () => {
    if (!editingRoom || !editingRoom.name.trim()) {
      toast({
        title: "Error",
        description: "Room name is required.",
        variant: "destructive",
      });
      return;
    }

    // Check if room name already exists (excluding current room)
    if (rooms.some(room => room.id !== editingRoom.id && room.name.toLowerCase() === editingRoom.name.toLowerCase())) {
      toast({
        title: "Error",
        description: "Room name already exists.",
        variant: "destructive",
      });
      return;
    }

    const updatedRooms = rooms.map(room =>
      room.id === editingRoom.id ? { ...editingRoom } : room
    );

    onRoomsChange(updatedRooms);
    setIsEditDialogOpen(false);
    setEditingRoom(null);
    
    toast({
      title: "Success",
      description: `Room ${editingRoom.name} updated successfully.`,
    });
  };

  const handleDeleteRoom = (roomId: string) => {
    const roomToDelete = rooms.find(r => r.id === roomId);
    const updatedRooms = rooms.filter(room => room.id !== roomId);
    onRoomsChange(updatedRooms);
    
    toast({
      title: "Success",
      description: `Room ${roomToDelete?.name} deleted successfully.`,
    });
  };

  const openEditDialog = (room: Room) => {
    setEditingRoom({ ...room });
    setIsEditDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Master Edit - Room Management
        </CardTitle>
        <CardDescription>
          Add, edit, or remove rooms from the system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add New Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Room</DialogTitle>
              <DialogDescription>
                Enter the details for the new room
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Room Name</label>
                <Input
                  value={newRoom.name}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., 101, SH1, etc."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Rows</label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={newRoom.rows}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, rows: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Columns</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={newRoom.columns}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, columns: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Block</label>
                <Select value={newRoom.block} onValueChange={(value) => setNewRoom(prev => ({ ...prev, block: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Main Block">Main Block</SelectItem>
                    <SelectItem value="New Block">New Block</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select value={newRoom.type} onValueChange={(value: 'Classroom' | 'Seminar Hall') => setNewRoom(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Classroom">Classroom</SelectItem>
                    <SelectItem value="Seminar Hall">Seminar Hall</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={newRoom.priority}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddRoom} className="flex-1">Add Room</Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Room</DialogTitle>
              <DialogDescription>
                Modify the room details
              </DialogDescription>
            </DialogHeader>
            {editingRoom && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Room Name</label>
                  <Input
                    value={editingRoom.name}
                    onChange={(e) => setEditingRoom(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    placeholder="e.g., 101, SH1, etc."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Rows</label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={editingRoom.rows}
                      onChange={(e) => setEditingRoom(prev => prev ? ({ ...prev, rows: parseInt(e.target.value) || 1 }) : null)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Columns</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={editingRoom.columns}
                      onChange={(e) => setEditingRoom(prev => prev ? ({ ...prev, columns: parseInt(e.target.value) || 1 }) : null)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Block</label>
                  <Select value={editingRoom.block} onValueChange={(value) => setEditingRoom(prev => prev ? ({ ...prev, block: value }) : null)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Main Block">Main Block</SelectItem>
                      <SelectItem value="New Block">New Block</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <Select value={editingRoom.type} onValueChange={(value: 'Classroom' | 'Seminar Hall') => setEditingRoom(prev => prev ? ({ ...prev, type: value }) : null)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Classroom">Classroom</SelectItem>
                      <SelectItem value="Seminar Hall">Seminar Hall</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={editingRoom.priority}
                    onChange={(e) => setEditingRoom(prev => prev ? ({ ...prev, priority: parseInt(e.target.value) || 1 }) : null)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleEditRoom} className="flex-1">Update Room</Button>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">Cancel</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="border rounded-lg">
          <div className="max-h-64 overflow-y-auto">
            {rooms.map((room) => (
              <div key={room.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                <div className="flex-1">
                  <div className="font-medium">{room.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {room.type} • {room.block} • {room.rows}×{room.columns} • Priority: {room.priority}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(room)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteRoom(room.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};