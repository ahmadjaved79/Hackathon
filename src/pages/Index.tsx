import { useNavigate } from 'react-router-dom';
import { ExamSeatingTool } from '@/components/ExamSeatingTool';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="p-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>
      <ExamSeatingTool />
    </div>
  );
};

export default Index;


