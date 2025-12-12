import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarClock, Users } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome to GuruBramha
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose your application
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all cursor-pointer group" onClick={() => navigate('/exam-seating')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <CalendarClock className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Exam Seating</CardTitle>
              <CardDescription>
                Manage exam seating arrangements and room allocations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg" onClick={() => navigate('/exam-seating')}>
                Open Seating Tool
              </Button>
            </CardContent>
          </Card>

          {/* <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all cursor-pointer group" onClick={() => navigate('/smartshala/login')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">SmartShala</CardTitle>
              <CardDescription>
                Track student attendance and manage classroom records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg" onClick={() => navigate('/smartshala/login')}>
                Open Attendance System
              </Button>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  );
}
