import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { SeatingArrangement, Room } from '../components/ExamSeatingTool';
import * as XLSX from 'xlsx';

// Re-export invigilator utility
export { downloadInvigilatorAllotment } from './invigilatorUtils';

// Helper function to get room block dynamically
const getRoomBlock = (roomName: string, rooms?: Room[]): string => {
  if (rooms) {
    const room = rooms.find(r => r.name === roomName);
    if (room) return room.block;
  }
  return ROOM_BLOCKS[roomName] || 'Unknown';
};

// Legacy room block mapping (fallback)
const ROOM_BLOCKS: { [roomName: string]: string } = {
  '2E1': 'Main Block',
  '2E2': 'Main Block',
  '2E3': 'Main Block',
  '2E4': 'Main Block',
  '2S4': 'Main Block',
  '3E2': 'Main Block',
  '3E3': 'Main Block',
  '3E4': 'Main Block',
  '3N1': 'Main Block',
  '3S4': 'Main Block',
  '403': 'New Block',
  '404': 'New Block',
  '405': 'New Block',
  '406': 'New Block',
  '407': 'New Block',
  '408': 'New Block',
  '411A': 'New Block',
  '204': 'New Block',
  '208': 'New Block',
  '209': 'New Block',
  '303': 'New Block',
  '304': 'New Block',
  '305': 'New Block',
  '306': 'New Block',
  '307': 'New Block',
  '308': 'New Block',
  '4E2': 'Main Block',
  '4E3': 'Main Block',
  '4E4': 'Main Block',
  '4E5': 'Main Block',
  '4E8': 'Main Block',
  '4E9': 'Main Block',
  '4E10': 'Main Block',
  '4E11': 'Main Block',
  'NDH': 'New Block',
  'NSH1': 'Main Block',
  'NSH2': 'Main Block',
  'SH1A': 'Main Block',
  'SH1B': 'Main Block',
  'SSH': 'Main Block'};

export async function downloadQuestionPaperAllocation(
  arrangements: SeatingArrangement[],
  examDate: string = '',
  examTitle: string = '',
  examStartTime: string = '',
  examEndTime: string = '',
  subjects: { [branch: string]: { subject: string; subjectTitle: string } } = {},
  rooms?: Room[]
): Promise<void> {
  // -------------------------------
  // Step 1: Collect unique subjects from students
  // -------------------------------
  const allSubjects = new Set<string>();

  arrangements.forEach(arr => {
    arr.students.flat().forEach(student => {
      if (student && student.subject) {
        allSubjects.add(student.subject);
      }
    });
  });

  const subjectList = Array.from(allSubjects).sort();

  // -------------------------------
  // Step 2: Add exam info at the top
  // -------------------------------
  const examInfo = `${examTitle || 'Exam Title Not Provided'} - ${examDate || ''} ${
    examStartTime && examEndTime ? `(${examStartTime} to ${examEndTime})` : ''
  }`;

  const data: any[] = [
    [examInfo], // Exam info in first row
    [], // Empty spacer row
    ['Room Name', 'Paper Counts'] // Header row
  ];

  // -------------------------------
  // Step 3: Build rows - One row per room (VERTICAL)
  // -------------------------------
  arrangements.forEach(arrangement => {
    const roomName = arrangement.roomName;
    
    // Build paper counts for this room
    let paperCounts = '';
    subjectList.forEach(subject => {
      let count = 0;
      arrangement.students.flat().forEach(student => {
        if (student && student.subject === subject) count++;
      });

      if (count > 0) {
        paperCounts += `${subject} = ${count}\n`;
      }
    });

    // Add row: [Room Name, Paper Counts]
    data.push([roomName, paperCounts.trim()]);
    data.push( [] );
  });

  // -------------------------------
  // Step 4: Create Sheet and Style
  // -------------------------------
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 30 }, // Room Name column
    { wch: 40 }  // Paper Counts column (wider for multi-line text)
  ];

  // Enable text wrapping for all paper count cells
  arrangements.forEach((_, i) => {
    const rowIndex = i + 3; // Start from row 3 (after header)
    const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: 1 }); // Column B
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = {
        alignment: { wrapText: true, vertical: 'top' },
      };
    }
  });

  // Style header row (row 2, index 2)
  ['A3', 'B3'].forEach(cellRef => {
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = {
        font: { bold: true },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }
  });

  // -------------------------------
  // Step 5: Save Workbook
  // -------------------------------
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Papers Per Room');
  XLSX.writeFile(workbook, 'PapersPerRoom.xlsx');
}

export async function downloadConsolidatedPDF(
  arrangements: SeatingArrangement[],
  examDate: string = '',
  examTitle: string = '',
  examStartTime: string = '',
  examEndTime: string = ''
): Promise<void> {
  // Prepare rows for Excel
  const data: any[] = [];
  data.push(["Branch", "From Roll", "To Roll", "Room", "count"]);

  arrangements.forEach(arrangement => {
    const students = arrangement.students.flat().filter(s => s !== null);

    // Group by branch
    const branchGroups: { [branch: string]: string[] } = {};
    students.forEach(student => {
      if (student) {
        if (!branchGroups[student.branch]) {
          branchGroups[student.branch] = [];
        }
        branchGroups[student.branch].push(student.roll);
      }
    });

    // Sort and group by year
    Object.entries(branchGroups).forEach(([branch, rolls]) => {
      rolls.sort();
      const yearGroups: { [year: string]: string[] } = {};
      rolls.forEach(roll => {
        const yearPrefix = roll.substring(0, 2);
        if (!yearGroups[yearPrefix]) {
          yearGroups[yearPrefix] = [];
        }
        yearGroups[yearPrefix].push(roll);
      });

      Object.entries(yearGroups).forEach(([_, yearRolls]) => {
        yearRolls.sort();
        const fromRoll = yearRolls[0];
        const toRoll = yearRolls[yearRolls.length - 1];
        

        data.push([
          branch,
          fromRoll,
          toRoll,
          arrangement.roomName,
          yearRolls.length
        ]);
      });
    });
  });
// Sort rows by branch name (first column) before creating the worksheet
data.splice(1, 0, ...data.splice(1).sort((a, b) => {
  return a[0].localeCompare(b[0]);
}));
                                          
  // Create worksheet and workbook
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Consolidated Data");

// Download the Excel file
  XLSX.writeFile(workbook, `Consolidated_Student_Lookup_${new Date().toISOString().split('T')[0]}.xlsx`);
  }



export function generateRoomPDF(
  arrangement: SeatingArrangement,
  examDate: string = '',
  examTitle: string = '',
  examStartTime: string = '',
  examEndTime: string = '',
  subjects: { [branch: string]: { subject: string; subjectTitle: string } } = {},
  isAutonomous: boolean = false,
  rooms?: Room[]
): jsPDF {
  // === PAGE 1: LANDSCAPE (Seating Grid) ===
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 20;
  const topMargin = 14;

  // === HEADER (page 1) ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ANDHRA LOYOLA COLLEGE (AUTONOMOUS) :: VIJAYAWADA - 8', pageWidth / 2, 15, { align: 'center' });

  if (examTitle) {
    doc.setFontSize(12);
    doc.text(examTitle, pageWidth / 2, 24, { align: 'center' });
  }
if(examDate){
  const [a,b,c] = examDate.split("-");
  examDate=`${c} / ${b} / ${a}`;
}
  // === Room Info (page 1) ===
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  let roomLine = `Room: ${arrangement.roomName}`;
  if (examDate) roomLine += ` | Date: ${examDate}`;
  if (examStartTime && examEndTime) {
    const formatTime12 = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
    };
    roomLine += ` | Time: ${formatTime12(examStartTime)} - ${formatTime12(examEndTime)}`;
  }
  doc.text(roomLine, pageWidth / 2, 32, { align: 'center' });

  // === GRID (page 1) ===
  const rows = arrangement.students.length;
  const cols = arrangement.students[0]?.length || 0;
  const yStart = 50;
  const availableHeight = pageHeight - yStart - bottomMargin;
  const availableWidth = pageWidth - 40;

  const cellSizeH = Math.min(availableHeight / rows, 35);
  const cellSizeW = Math.min(availableWidth / cols, 35);

  const totalGridHeight = cellSizeH * rows;
  const totalGridWidth = cellSizeW * cols;
  const gridX = (pageWidth - totalGridWidth) / 2;
  const gridY = yStart;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
// Calculate spacing after every (cols / 3)rd column
const groupSize = Math.floor(cols / 3) || cols; // e.g. 9→3, 6→2, fallback to all if small
const gapSize = 6; // small extra space between bench groups (in points, ~1.7mm)
  arrangement.students.forEach((row, r) => {
    row.forEach((student, c) => {
// Count how many full groups have passed before this column
const groupGaps = Math.floor(c / groupSize);
const x = gridX + c * cellSizeW + groupGaps * gapSize;
      
      const y = gridY + r * cellSizeH;
      doc.rect(x, y, cellSizeW, cellSizeH);

      const lines = [`(${r + 1},${c + 1})`];
      if (student) lines.push(student.roll, student.branch.slice(2));

      let lineY = y + 4;
      lines.forEach((line, i) => {
        doc.setFont('helvetica', i === 1 ? 'bold' : 'normal');
        doc.text(line, x + cellSizeW / 2, lineY, { align: 'center' });
        lineY += 4;
      });
    });
  });

  // -----------------------------
  // === PAGE 2: ATTENDANCE TABLE ===
  // Robust, export-quality layout:
  // - Keep a small page header (no examTitle here)
  // - Compute rows per column dynamically
  // - 2 columns per page; create new pages if overflow
  // - Signature line in a single horizontal row
  // -----------------------------

  // force landscape for page 2 as well
  doc.addPage('l');

  const page2Width = doc.internal.pageSize.getWidth();
  const page2Height = doc.internal.pageSize.getHeight();

  // Page margins and layout constants (tweakable)
  const margin = 14;
  const colGap = 12; // gap between left/right tables
  const headerRowHeight = 12;
  const preferredRowHeight = 10;
  const minRowHeight = 7;
  const maxRowHeight = 14;
  const signatureAreaHeight = 20;

  // Page header (kept minimal & clear). We do NOT include examTitle here per your request.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('ATTENDANCE SHEET', page2Width / 2, margin, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Room: ${arrangement.roomName} | Date: ${examDate}`, page2Width / 2, margin + 8, { align: 'center' });

  // Prepare branch rows (sorted for stability)
  const branchGroups = Object.entries(arrangement.branchCounts || {}).map(([branch, count]) => ({
    branch,
    count,
  })).sort((a, b) => a.branch.localeCompare(b.branch));

  const totalRows = branchGroups.length;

  // Top Y (where first table header will start)
  const tableTopY = margin + 18;

  // Available vertical space for rows (excluding header row and signatures)
  let usableHeight = page2Height - tableTopY - bottomMargin - signatureAreaHeight;
  if (usableHeight < 40) usableHeight = Math.max(usableHeight, 40); // defensive

  // Decide rowHeight dynamically so layout remains readable
  let rowHeight = preferredRowHeight;
  let rowsPerColumn = Math.floor((usableHeight - headerRowHeight) / rowHeight);
  if (rowsPerColumn < 4) {
    // try to shrink rowHeight a bit to fit at least 4 rows, but don't go below minRowHeight
    rowHeight = Math.max(minRowHeight, Math.floor((usableHeight - headerRowHeight) / 4));
    rowsPerColumn = Math.floor((usableHeight - headerRowHeight) / rowHeight);
  }
  // clamp rowHeight
  rowHeight = Math.min(maxRowHeight, Math.max(minRowHeight, rowHeight));
  rowsPerColumn = Math.max(1, rowsPerColumn);

  // rows per page (two columns)
  const rowsPerPage = rowsPerColumn * 2;

  // function to draw a single table (with header) at x,y for `rowsToDraw`
  const drawTable = (x: number, y: number, tableWidth: number, rowsToDraw: { branch: string; count: number }[]) => {
    const colBranch = tableWidth * 0.25;
    const colTotal = tableWidth * 0.10;
    const colAbsent = tableWidth - colBranch - colTotal;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.rect(x, y, tableWidth, headerRowHeight);
    doc.text('Branch', x + 4, y + headerRowHeight / 2 + 3);
    doc.text('Total', x + colBranch + 4, y + headerRowHeight / 2 + 3);
    doc.text('ABSENT (Roll Nos.)', x + colBranch + colTotal + 4, y + headerRowHeight / 2 + 3);

    // vertical separator lines (from header top to end of rows area)
    const tableBodyHeight = rowsToDraw.length * rowHeight;
    doc.setLineWidth(0.2);
    let cx = x + colBranch;
    doc.line(cx, y, cx, y + headerRowHeight + tableBodyHeight);
    cx += colTotal;
    doc.line(cx, y, cx, y + headerRowHeight + tableBodyHeight);

    // Rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let rowY = y + headerRowHeight;
    rowsToDraw.forEach((entry, i) => {
      doc.rect(x, rowY, tableWidth, rowHeight);
      // Branch name (wrap long branch names into two lines if necessary)
      const branchText = String(entry.branch || '');
      const branchLines = doc.splitTextToSize(branchText, colBranch - 6);
      // print branch lines vertically centered in the row (top align to preserve uniform height)
      let branchTextY = rowY + 4;
      branchLines.forEach((ln) => {
        doc.text(ln, x + 4, branchTextY);
        branchTextY += 4;
      });

      doc.text(String(entry.count), x + colBranch + 6, rowY + rowHeight / 2 + 3);

      // ABSENT column left intentionally blank for signatures/roll numbers written by invigilator
      rowY += rowHeight;
    });

    // Return bottom Y of this table (y + header + rows height)
    return y + headerRowHeight + tableBodyHeight;
  };

  // Pagination: figure pages needed and render them
  const pagesNeeded = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  for (let p = 0; p < pagesNeeded; p++) {
    // on first iteration we're already on page 2; on subsequent iterations addPage()
    if (p > 0) {
      doc.addPage('l');
      // redraw small header on subsequent pages too
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('ATTENDANCE SHEET', page2Width / 2, margin, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Room: ${arrangement.roomName} | Date: ${examDate}`, page2Width / 2, margin + 8, { align: 'center' });
    }

    const pageStartIndex = p * rowsPerPage;
    const pageEntries = branchGroups.slice(pageStartIndex, pageStartIndex + rowsPerPage);

    // split into two columns for this page
    const leftCount = Math.min(rowsPerColumn, pageEntries.length);
    // rightCount is whatever is left
    const leftEntries = pageEntries.slice(0, leftCount);
    const rightEntries = pageEntries.slice(leftCount);

    // compute table widths
    const twoColTotalWidth = page2Width - 2 * margin - colGap;
    const singleTableWidth = page2Width - 2 * margin;

    // Draw left table (always present if entries exist)
    const leftX = margin;
    const leftY = tableTopY;
    const leftTableWidth = (rightEntries.length > 0) ? (twoColTotalWidth / 2) : singleTableWidth;

    let leftBottom = leftY;
    if (leftEntries.length > 0) {
      leftBottom = drawTable(leftX, leftY, leftTableWidth, leftEntries);
    } else {
      // draw only headers with no rows (if no entries)
      leftBottom = drawTable(leftX, leftY, leftTableWidth, []);
    }

    // Draw right table if entries exist
    let rightBottom = leftBottom;
    if (rightEntries.length > 0) {
      // position second column to the right
      const rightX = margin + leftTableWidth + colGap;
      const rightTableWidth = twoColTotalWidth - leftTableWidth;
      rightBottom = drawTable(rightX, leftY, rightTableWidth, rightEntries);
    }

    // Signature line: single horizontal row with 3 placeholders (landscape)
    const sigY = Math.max(leftBottom, rightBottom) + 12;
    const sigLineY = Math.min(sigY, page2Height - bottomMargin - 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Signature layout (three evenly spaced signatures on one line)
const availableWidth = page2Width - 2 * margin;
const sigWidth = 120;  // approximate width occupied by one signature
const gap = (availableWidth - 3 * sigWidth) / 2;

const sig1X = margin;
const sig2X = margin + sigWidth + gap;
const sig3X = margin + 2 * (sigWidth + gap);

    doc.text('Invigilator 1 Signature: ___________________', sig1X, sigY);
    doc.text('Invigilator 2 Signature: ___________________', sig2X, sigY);
    doc.text('Invigilator 3 Signature: ___________________', sig3X, sigY);
  }

  return doc;
}

  
    
    

    

              


  // Compact header on new page
  export async function downloadSingleRoomPDF(
  arrangement: SeatingArrangement, 
  examDate: string = '', 
  examTitle: string = '', 
  examStartTime: string = '', 
  examEndTime: string = '', 
  subjects: {[branch: string]: {subject: string, subjectTitle: string}} = {},
  isAutonomous: boolean = false,
  rooms?: Room[]
): Promise<void> {
  const doc = generateRoomPDF(arrangement, examDate, examTitle, examStartTime, examEndTime, subjects, isAutonomous, rooms);
  doc.save(`${arrangement.roomName}_Seating_Arrangement.pdf`);
}

// Download all room PDFs as a ZIP file
export async function downloadAllPDFs(
  arrangements: SeatingArrangement[], 
  examDate: string = '', 
  examTitle: string = '', 
  examStartTime: string = '', 
  examEndTime: string = '', 
  subjects: {[branch: string]: {subject: string, subjectTitle: string}} = {},
  isAutonomous: boolean = false,
  rooms?: Room[]
): Promise<void> {
  const zip = new JSZip();
  
  arrangements.forEach(arrangement => {
    const doc = generateRoomPDF(arrangement, examDate, examTitle, examStartTime, examEndTime, subjects, isAutonomous, rooms);
    const pdfBlob = doc.output('blob');
    zip.file(`${arrangement.roomName}_Seating_Arrangement.pdf`, pdfBlob);
  });
  
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `Exam_Seating_Arrangements_${new Date().toISOString().split('T')[0]}.zip`);
}
  
      
  
                                           
      
          
// Generate Papers Per Room 

export async function OLDERdownloadQuestionPaperAllocation(
  arrangements: SeatingArrangement[],
  examDate: string = '',
  examTitle: string = '',
  examStartTime: string = '',
  examEndTime: string = '',
  subjects: { [branch: string]: { subject: string; subjectTitle: string } } = {}, // kept for legacy compatibility
  rooms?: Room[]
): Promise<void> {
  // -------------------------------
  // Step 1: Collect unique subjects from students (not from UI)
  // -------------------------------
  const allSubjects = new Set<string>();

  arrangements.forEach(arr => {
    arr.students.flat().forEach(student => {
      if (student && student.subject) {
        allSubjects.add(student.subject);
      }
    });
  });

  const subjectList = Array.from(allSubjects).sort();

  // -------------------------------
  // Step 2: Add exam info at the top
  // -------------------------------
  const examInfo = [
    `${examTitle || 'Exam Title Not Provided'} - ${examDate || ''} ${
      examStartTime && examEndTime ? `(${examStartTime} to ${examEndTime})` : ''
    }`,
  ];

  const data: any[] = [examInfo, []]; // Exam info + empty spacer row

  // -------------------------------
  // Step 3: Header Row (Room Names)
  // -------------------------------
  const headerRow = arrangements.map(a => a.roomName);
  data.push(['', ...headerRow]);

  // -------------------------------
  // Step 4: Build second row - Paper info (per subject per room)
  // -------------------------------
  const paperInfoRow: any[] = ['Paper Counts'];

  arrangements.forEach(arrangement => {
    let cellContent = '';

    subjectList.forEach(subject => {
      // Count how many students in this room have this subject
      let count = 0;
      arrangement.students.flat().forEach(student => {
        if (student && student.subject === subject) count++;
      });

      if (count > 0) {
        cellContent += `${subject} = ${count}\n`;
      }
    });

    paperInfoRow.push(cellContent.trim());
  });

  data.push(paperInfoRow);

  // -------------------------------
  // Step 5: Create Sheet and Style
  // -------------------------------
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  const colWidths = headerRow.map(() => ({ wch: 25 }));
  worksheet['!cols'] = [{ wch: 30 }, ...colWidths];

  // Enable text wrapping for paper info row
  arrangements.forEach((_, i) => {
    const cellRef = XLSX.utils.encode_cell({ r: 3, c: i + 1 }); // row 3 (0-indexed)
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = {
        alignment: { wrapText: true, vertical: 'top' },
      };
    }
  });

  // -------------------------------
  // Step 6: Save Workbook
  // -------------------------------
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Papers Per Room');
  XLSX.writeFile(workbook, 'PapersPerRoom.xlsx');
}




  

// Generate Attendance Sheets (one PDF per room, zipped)

export async function downloadAttendanceSheets(
  arrangements: SeatingArrangement[],
  examDate: string = '',
  examTitle: string = '',
  examStartTime: string = '',
  examEndTime: string = '',
  subjects: { [branch: string]: { subject: string; subjectTitle: string } } = {},
  isAutonomous: boolean = false,
  rooms?: Room[]
): Promise<void> {
  const zip = new JSZip();
  
if(examDate){
              const [a,b,c] = examDate.split("-");
              examDate=`${c} / ${b} / ${a}`;
}
  arrangements.forEach(arrangement => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;

    const formatTime12 = (timeStr: string) => {
      if (!timeStr) return '';
      const [hour, minute] = timeStr.split(':').map(Number);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
    };

    const students = arrangement.students.flat().filter(s => s !== null);
    const sortedStudents = [...students].sort((a, b) => a.branch.localeCompare(b.branch));

    let currentY = margin;

    const drawHeader = () => {
      currentY = margin;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('ANDHRA LOYOLA COLLEGE (AUTONOMOUS)::VIJAYAWADA-8', pageWidth / 2, currentY, { align: 'center' });
      currentY += 7;

      if (examTitle) {
        doc.setFontSize(12);
        doc.text(examTitle, pageWidth / 2, currentY, { align: 'center' });
        currentY += 7;
      }
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      let infoLine = `Room: ${arrangement.roomName}`;
      if (examDate) infoLine += ` | Date: ${examDate}`;
      if (examStartTime && examEndTime)
        infoLine += ` | Time: ${formatTime12(examStartTime)} - ${formatTime12(examEndTime)}`;
      doc.text(infoLine, pageWidth / 2, currentY, { align: 'center' });
      currentY += 10;
    };

    const drawTableHeader = () => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);

      const col1Width = 30;
      const col2Width = 70;
      const col3Width = 35;
      const col4Width = pageWidth - 2 * margin - col1Width - col2Width - col3Width;
      const headerHeight = 10;

      doc.rect(margin, currentY, col1Width, headerHeight);
      doc.text('BRANCH', margin + col1Width / 2, currentY + 6, { align: 'center' });

      doc.rect(margin + col1Width, currentY, col2Width, headerHeight);
      doc.text('STUDENT DETAILS', margin + col1Width + col2Width / 2, currentY + 6, { align: 'center' });

      doc.rect(margin + col1Width + col2Width, currentY, col3Width, headerHeight);
      doc.text('BOOKLET NO.', margin + col1Width + col2Width + col3Width / 2, currentY + 6, { align: 'center' });

      doc.rect(margin + col1Width + col2Width + col3Width, currentY, col4Width, headerHeight);
      doc.text('SIGNATURE', margin + col1Width + col2Width + col3Width + col4Width / 2, currentY + 6, { align: 'center' });

      currentY += headerHeight;
      return { col1Width, col2Width, col3Width, col4Width };
    };


    // ===== MAIN CONTENT =====
    drawHeader();
    let { col1Width, col2Width, col3Width, col4Width } = drawTableHeader();

    sortedStudents.forEach(student => {
      if (!student) return;
      const subjectInfo = subjects[student.branch];
      const detailsText = `${student.roll} | ${student.subject}`;
      
      const lines = doc.splitTextToSize(detailsText, col2Width - 4);
      const rowHeight = Math.max(12, lines.length * 6);

      if (currentY + rowHeight > pageHeight - 27) {
        doc.addPage();
        currentY = margin;
        ({ col1Width, col2Width, col3Width, col4Width } = drawTableHeader());
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      doc.rect(margin, currentY, col1Width, rowHeight);
      doc.text(student.branch, margin + col1Width / 2, currentY + 7, { align: 'center' });

      doc.rect(margin + col1Width, currentY, col2Width, rowHeight);
      doc.text(lines, margin + col1Width + 2, currentY + 6);

      doc.rect(margin + col1Width + col2Width, currentY, col3Width, rowHeight);
      doc.rect(margin + col1Width + col2Width + col3Width, currentY, col4Width, rowHeight);

      currentY += rowHeight;
    });

    // ===== ENHANCED SUMMARY TABLE =====
const branchCounts: Record<string, number> = {};
sortedStudents.forEach(s => {
  branchCounts[s.branch] = (branchCounts[s.branch] || 0) + 1;
});

const branches = Object.keys(branchCounts);
const startY = currentY + 15;
const headerHeight = 8;
const rowHeight = 8;
const signatureSpace = 45;
const requiredHeight = headerHeight + branches.length * rowHeight + signatureSpace;

// === Check available space, else go to next page ===
if (startY + requiredHeight > pageHeight - margin) {
  doc.addPage();
  currentY = margin;
} else {
  currentY = startY;
}

// === Title ===
doc.setFont('helvetica', 'bold');
doc.setFontSize(12);
doc.text('Branch-wise Summary', pageWidth / 2, currentY, { align: 'center' });
currentY += 5;

// === Table Layout ===
const tableTopY = currentY + 5;
const tableLeftX = margin;

// Dynamically stretch columns (ABSENT goes till right margin)
const branchColWidth = 50;
const totalColWidth = 25;
const absentColWidth = pageWidth - margin - (tableLeftX + branchColWidth + totalColWidth);
const tableWidth = branchColWidth + totalColWidth + absentColWidth;

// === Draw Table ===
doc.setFontSize(10);
doc.setFont('helvetica', 'bold');

// Header
doc.rect(tableLeftX, tableTopY, branchColWidth, headerHeight);
doc.rect(tableLeftX + branchColWidth, tableTopY, totalColWidth, headerHeight);
doc.rect(tableLeftX + branchColWidth + totalColWidth, tableTopY, absentColWidth, headerHeight);

doc.text('BRANCH', tableLeftX + branchColWidth / 2, tableTopY + 5, { align: 'center' });
doc.text('TOTAL', tableLeftX + branchColWidth + totalColWidth / 2, tableTopY + 5, { align: 'center' });
doc.text('ABSENT (Roll Nos.)', tableLeftX + branchColWidth + totalColWidth + absentColWidth / 2, tableTopY + 5, { align: 'center' });

// Rows
let y = tableTopY + headerHeight;
doc.setFont('helvetica', 'normal');

branches.forEach(branch => {
  // check for page overflow
  if (y + rowHeight + signatureSpace > pageHeight - margin) {
    doc.addPage();
    y = margin + 5;

    // re-draw header on new page
    doc.setFont('helvetica', 'bold');
    doc.rect(tableLeftX, y, branchColWidth, headerHeight);
    doc.rect(tableLeftX + branchColWidth, y, totalColWidth, headerHeight);
    doc.rect(tableLeftX + branchColWidth + totalColWidth, y, absentColWidth, headerHeight);

    doc.text('BRANCH', tableLeftX + branchColWidth / 2, y + 5, { align: 'center' });
    doc.text('TOTAL', tableLeftX + branchColWidth + totalColWidth / 2, y + 5, { align: 'center' });
    doc.text('ABSENT (Roll Nos.)', tableLeftX + branchColWidth + totalColWidth + absentColWidth / 2, y + 5, { align: 'center' });

    y += headerHeight;
    doc.setFont('helvetica', 'normal');
  }

  // draw row
  doc.rect(tableLeftX, y, branchColWidth, rowHeight);
  doc.rect(tableLeftX + branchColWidth, y, totalColWidth, rowHeight);
  doc.rect(tableLeftX + branchColWidth + totalColWidth, y, absentColWidth, rowHeight);

  doc.text(branch, tableLeftX + branchColWidth / 2, y + 5, { align: 'center' });
  doc.text(String(branchCounts[branch] || 0), tableLeftX + branchColWidth + totalColWidth / 2, y + 5, { align: 'center' });

  y += rowHeight;
});

// === Invigilator Signatures (stacked neatly) ===
const sigY = y + 12;
const lineGap = 10; // vertical gap between signature lines
const sigX = margin;

doc.setFont('helvetica', 'normal');
doc.setFontSize(10);

doc.text('Invigilator 1 Signature: __________________', sigX, sigY);
doc.text('Invigilator 2 Signature: __________________', sigX, sigY + lineGap);
doc.text('Invigilator 3 Signature: __________________', sigX, sigY + 2 * lineGap);

currentY = sigY + 2 * lineGap + 15; // move cursor below last signature
    
    
    // ===== EXPORT =====
    const pdfBlob = doc.output('blob');
    zip.file(`${arrangement.roomName}.pdf`, pdfBlob);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `AttendanceSheets.zip`);
}






         
// Generate Cross Verification Sheet
    
export async function downloadCrossVerificationSheet(
  arrangements: SeatingArrangement[],
  examDate: string = '',
  examTitle: string = '',
  examStartTime: string = '',
  examEndTime: string = '',
  subjects: {[branch: string]: {subject: string, subjectTitle: string}} = {},
  isAutonomous: boolean = false
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 10;
  const RECORDS_PER_PAGE = 120; // Threshold for pagination
  
  // Helper function to format time
  const formatTime12 = (timeStr: string) => {
    if (!timeStr) return '';
    const [hour, minute] = timeStr.split(':').map(Number);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };
  
  // Format date
  let formattedDate = examDate;
  if(examDate){
    const [a,b,c] = examDate.split("-");
    formattedDate = `${c} / ${b} / ${a}`;
  }
  
  // Group students by subject
  const subjectGroups: { [subject: string]: { rolls: string[] } } = {};

  arrangements.forEach(arrangement => {
    arrangement.students.flat().filter(s => s !== null).forEach(student => {
      if (student && student.subject) {
        const subjectKey = student.subject;
        if (!subjectGroups[subjectKey]) {
          subjectGroups[subjectKey] = { rolls: [] };
        }
        subjectGroups[subjectKey].rolls.push(student.roll);
      }
    });
  });
  
  // Sort subjects
  const sortedSubjects = Object.keys(subjectGroups).sort();
  
  let isFirstPage = true;
  
  // Helper function to draw header
  const drawHeader = (subject: string, subjectTitle: string, pageNum: number, totalPages: number) => {
    let currentY = margin;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ANDHRA LOYOLA COLLEGE (AUTONOMOUS)::VIJAYAWADA-8', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;
    
    if (isAutonomous) {
      doc.text('(AUTONOMOUS)', pageWidth / 2, currentY, { align: 'center' });
      currentY += 7;
    }
    
    if (examTitle) {
      doc.setFontSize(12);
      doc.text(examTitle, pageWidth / 2, currentY, { align: 'center' });
      currentY += 7;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let infoLine = '';
    if (formattedDate) infoLine += `Date: ${formattedDate}`;
    if (examStartTime && examEndTime) {
      if (infoLine) infoLine += ' | ';
      infoLine += `Time: ${formatTime12(examStartTime)} - ${formatTime12(examEndTime)}`;
    }
    if (infoLine) {
      doc.text(infoLine, pageWidth / 2, currentY, { align: 'center' });
      currentY += 7;
    }
    
    // Subject heading with page number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const subjectText = `${subject} – ${subjectTitle}`;
    doc.text(subjectText, pageWidth / 2, currentY, { align: 'center' });
    
    // Add page number on the right
    if (totalPages > 1) {
      doc.setFontSize(10);
      doc.text(`Page ${pageNum}/${totalPages}`, pageWidth - margin, currentY, { align: 'right' });
    }
    
    currentY += 10;
    return currentY;
  };
  
  sortedSubjects.forEach(subject => {
    const { rolls } = subjectGroups[subject];
    const subjectTitle = subjects[subject]?.subjectTitle || '';
    rolls.sort();
    
    // Remove duplicates
    const uniqueRolls = Array.from(new Set(rolls));
    const totalStudents = uniqueRolls.length;
    
    // Calculate how many pages needed
    const totalPages = Math.ceil(totalStudents / RECORDS_PER_PAGE);
    
    // Split rolls into pages
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;
      
      const startIdx = (pageNum - 1) * RECORDS_PER_PAGE;
      const endIdx = Math.min(startIdx + RECORDS_PER_PAGE, totalStudents);
      const pageRolls = uniqueRolls.slice(startIdx, endIdx);
      
      // Draw header
      let currentY = drawHeader(subject, subjectTitle, pageNum, totalPages);
      
      // Calculate grid dimensions for this page
      const availableWidth = pageWidth - 2 * margin;
      const availableHeight = pageHeight - currentY - 50; // Leave space for summary
      
      // Fixed readable font size and columns
      const fontSize = 8;
      const columns = 6;
      const cellWidth = availableWidth / columns;
      const cellHeight = 10;
      
      // Draw roll number grid
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      
      pageRolls.forEach((roll, idx) => {
        const row = Math.floor(idx / columns);
        const col = idx % columns;
        const x = margin + col * cellWidth;
        const y = currentY + row * cellHeight;
        
        doc.rect(x, y, cellWidth, cellHeight);
        doc.text(roll, x + cellWidth / 2, y + cellHeight / 2 + 2, { align: 'center' });
      });
      
      const gridRows = Math.ceil(pageRolls.length / columns);
      currentY += gridRows * cellHeight + 10;
      
      // Summary table (only on last page of this subject)
      if (pageNum === totalPages) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);

        const tableWidth = 160;
        const tableX = (pageWidth - tableWidth) / 2;
        const colWidth = tableWidth / 4;
        const rowHeight = 10;

        // Header row
        doc.rect(tableX, currentY, tableWidth, rowHeight);
        doc.text('Total Students', tableX + colWidth * 0.5, currentY + 6, { align: 'center' });
        doc.line(tableX + colWidth, currentY, tableX + colWidth, currentY + rowHeight);

        doc.text('Present', tableX + colWidth + colWidth * 0.5, currentY + 6, { align: 'center' });
        doc.line(tableX + 2 * colWidth, currentY, tableX + 2 * colWidth, currentY + rowHeight);

        doc.text('Absent', tableX + 2 * colWidth + colWidth * 0.5, currentY + 6, { align: 'center' });
        doc.line(tableX + 3 * colWidth, currentY, tableX + 3 * colWidth, currentY + rowHeight);

        doc.text('S.M.P', tableX + 3 * colWidth + colWidth * 0.5, currentY + 6, { align: 'center' });

        // Data row
        currentY += rowHeight;
        doc.setFont('helvetica', 'normal');
        doc.rect(tableX, currentY, tableWidth, rowHeight);

        // Total Students value
        doc.text(String(totalStudents), tableX + colWidth * 0.5, currentY + 6, { align: 'center' });

        // Vertical separators for data row
        doc.line(tableX + colWidth, currentY, tableX + colWidth, currentY + rowHeight);
        doc.line(tableX + 2 * colWidth, currentY, tableX + 2 * colWidth, currentY + rowHeight);
        doc.line(tableX + 3 * colWidth, currentY, tableX + 3 * colWidth, currentY + rowHeight);
      } else {
        // Add "continued on next page" note
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.text('(Continued on next page...)', pageWidth / 2, pageHeight - 15, { align: 'center' });
      }
    }
  });
  
  doc.save('CrossVerification.pdf');
      }
