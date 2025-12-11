import * as XLSX from 'xlsx';
import { SeatingArrangement } from '@/components/ExamSeatingTool';

export async function downloadInvigilatorAllotment(
  invigilatorAssignment: {[roomName: string]: string[]},
  arrangements: SeatingArrangement[]
): Promise<void> {
  // Get room names from arrangements
  const roomNames = arrangements.map(arr => arr.roomName);
  
  // Build data array for Excel
  const data: any[] = [];
  
  // Header row with room names
  const headerRow = ['Invigilator Allotment', ...roomNames];
  data.push(headerRow);
  
  // Find the maximum number of invigilators in any room
  const maxInvigilators = Math.max(
    ...roomNames.map(room => invigilatorAssignment[room]?.length || 0)
  );
  
  // Build rows for each invigilator position
  for (let i = 0; i < maxInvigilators; i++) {
    const row: any[] = [i + 1]; // Row number
    
    roomNames.forEach(roomName => {
      const invigilators = invigilatorAssignment[roomName] || [];
      row.push(invigilators[i] || '');
    });
    
    data.push(row);
  }
  
  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths
  const colWidths = [{ wch: 20 }, ...roomNames.map(() => ({ wch: 25 }))];
  worksheet['!cols'] = colWidths;
  
  // Create workbook and save
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'InvigilatorAllotment');
  XLSX.writeFile(workbook, 'InvigilatorAllotment.xlsx');
}
