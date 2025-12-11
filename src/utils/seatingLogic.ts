import { Student, Room, SeatingArrangement, AllocationMode } from '../components/ExamSeatingTool';
import { ArrangementMode } from '../components/ArrangementModeSelector';

// Export types for external use
export type { Student, Room, SeatingArrangement, AllocationMode };

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Sort students by branch, then by roll number within each branch
function sortStudentsByBranchAndRoll(students: Student[]): Student[] {
  const branchGroups: { [branch: string]: Student[] } = {};
  
  // Group students by branch
  students.forEach(student => {
    if (!branchGroups[student.branch]) {
      branchGroups[student.branch] = [];
    }
    branchGroups[student.branch].push(student);
  });

  // Sort each branch group by roll number
  Object.keys(branchGroups).forEach(branch => {
    branchGroups[branch].sort((a, b) => a.roll.localeCompare(b.roll));
  });

  // Concatenate all sorted branch groups
  const sortedStudents: Student[] = [];
  Object.keys(branchGroups).sort().forEach(branch => {
    sortedStudents.push(...branchGroups[branch]);
  });

  return sortedStudents;
}

// Count students by branch in a room
function countStudentsByBranch(students: (Student | null)[][]): { [branch: string]: number } {
  const branchCounts: { [branch: string]: number } = {};
  
  students.flat().forEach(student => {
    if (student) {
      branchCounts[student.branch] = (branchCounts[student.branch] || 0) + 1;
    }
  });

  return branchCounts;
}

// Check if two students can sit adjacent horizontally (strict rule)
function canSitAdjacentHorizontally(student1: Student | null, student2: Student | null): boolean {
  if (!student1 || !student2) return true;
  // Strict rule: No same subject students horizontally adjacent
  return student1.subject !== student2.subject;
}

// Check if two students can sit adjacent vertically or diagonally
function canSitAdjacentVerticalDiagonal(student1: Student | null, student2: Student | null): boolean {
  if (!student1 || !student2) return true;
  if (student1.subject !== student2.subject) return true;
  
  // Same subject students can be vertical/diagonal only if roll numbers are not consecutive
  const roll1 = parseInt(student1.roll.replace(/\D/g, '')) || 0;
  const roll2 = parseInt(student2.roll.replace(/\D/g, '')) || 0;
  return Math.abs(roll1 - roll2) > 1;
}

// Legacy function for backward compatibility
function canSitAdjacent(student1: Student | null, student2: Student | null): boolean {
  if (!student1 || !student2) return true;
  return student1.subject !== student2.subject;
}

// Get adjacent positions for a given seat
function getAdjacentPositions(row: number, col: number, maxRows: number, maxCols: number): number[][] {
  const adjacent: number[][] = [];
  const directions = [
    [-1, -1], [-1, 0], [-1, 1], // top row
    [0, -1],           [0, 1],  // same row
    [1, -1],  [1, 0],  [1, 1]   // bottom row
  ];
  
  directions.forEach(([dr, dc]) => {
    const newRow = row + dr;
    const newCol = col + dc;
    if (newRow >= 0 && newRow < maxRows && newCol >= 0 && newCol < maxCols) {
      adjacent.push([newRow, newCol]);
    }
  });
  
  return adjacent;
}

// Generate randomized position sequences for multiple arrangement attempts
function generateRandomizedPositions(rows: number, cols: number, seed: number): number[][] {
  const positions: number[][] = [];
  
  // Create all possible positions
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      positions.push([row, col]);
    }
  }
  
  // Shuffle positions using seeded random for reproducible results
  const seededRandom = (seed: number) => {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  return positions;
}

// Enhanced conflict scoring system with detailed rules
function calculateEnhancedConflictScore(
  roomStudents: (Student | null)[][],
  row: number,
  col: number,
  student: Student,
  rows: number,
  cols: number
): number {
  let conflictScore = 0;
  
  // Get current student's roll number for gap calculations
  const currentRoll = parseInt(student.roll.replace(/\D/g, '')) || 0;
  
  // Check all adjacent positions with specific rules
  const adjacentPositions = [
    { pos: [row, col - 1], type: 'horizontal' }, // left
    { pos: [row, col + 1], type: 'horizontal' }, // right
    { pos: [row - 1, col], type: 'vertical' },   // top
    { pos: [row + 1, col], type: 'vertical' },   // bottom
    { pos: [row - 1, col - 1], type: 'diagonal' }, // top-left
    { pos: [row - 1, col + 1], type: 'diagonal' }, // top-right
    { pos: [row + 1, col - 1], type: 'diagonal' }, // bottom-left
    { pos: [row + 1, col + 1], type: 'diagonal' }  // bottom-right
  ];
  
  adjacentPositions.forEach(({ pos: [adjRow, adjCol], type }) => {
    if (adjRow >= 0 && adjRow < rows && adjCol >= 0 && adjCol < cols) {
      const adjacentStudent = roomStudents[adjRow][adjCol];
      if (!adjacentStudent) return;
      
      const adjRoll = parseInt(adjacentStudent.roll.replace(/\D/g, '')) || 0;
      const rollGap = Math.abs(currentRoll - adjRoll);
      
      // Apply conflict scoring rules
      if (student.branch === adjacentStudent.branch) {
  // Branch rules → 20% priority
  if (type === 'horizontal') {
    // Horizontal same branch → heavy penalty
    conflictScore += 100;
  } else if (type === 'vertical') {
    // Vertical same branch → medium penalty
    conflictScore += 0;
  } else if (type === 'diagonal') {
    // Diagonal same branch → small penalty
    conflictScore += 0;
  }
}
if (student.subject === adjacentStudent.subject) {
  // Subject rules → 80% priority
  if (type === 'horizontal') {
    // Horizontal same subject → smaller penalty than branch
    conflictScore += 8000;
  } else if (type === 'vertical') {
    if (rollGap <= 1) {
      // Vertical same subject + consecutive roll
      conflictScore += 4000;
    } else {
      // Vertical same subject + non-consecutive roll
      conflictScore +=2000;
    }
  } else if (type === 'diagonal') {
    // Diagonal same subject → tiny penalty
    conflictScore += 100;
  }
      }
      
      // Roll number gap bonus → -10 per valid gap (only for same branch)
      if (student.branch === adjacentStudent.branch && rollGap > 1) {
        conflictScore -= 10 * Math.min(rollGap - 1, 5); // Cap bonus at 50
      }
    }
  });
  
  return conflictScore;
}

// Legacy function for backward compatibility
function calculateBranchConflictScore(
  roomStudents: (Student | null)[][],
  row: number,
  col: number,
  student: Student,
  rows: number,
  cols: number
): number {
  return calculateEnhancedConflictScore(roomStudents, row, col, student, rows, cols);
}

// Enhanced Simple Arrangement - Multiple attempts with conflict calculation like anti-cheating
function arrangeStudentsSimple(students: Student[], room: Room): (Student | null)[][] {
  if (students.length === 0) {
    return Array(room.rows).fill(null).map(() => Array(room.columns).fill(null));
  }
  
  const attempts: { arrangement: (Student | null)[][], score: number }[] = [];
  const numAttempts = 3; // Try 3 different arrangements
  
  // Generate multiple arrangement attempts
  for (let attempt = 0; attempt < numAttempts; attempt++) {
    const seed = Date.now() + attempt * 100;
    const arrangement = generateSimpleArrangementAttempt(students, room, seed);
    const score = calculateSimpleConflictScore(arrangement);
    
    attempts.push({ arrangement, score });
  }
  
  // Return the arrangement with the lowest conflict score
  const bestArrangement = attempts.reduce((best, current) => 
    current.score < best.score ? current : best
  );
  
  console.log(`Simple arrangement: Generated ${numAttempts} attempts, best score: ${bestArrangement.score}`);
  
  return bestArrangement.arrangement;
}

// Calculate conflict score for simple arrangement considering branches and subjects
function calculateSimpleConflictScore(arrangement: (Student | null)[][]): number {
  let totalScore = 0;
  const rows = arrangement.length;
  const cols = arrangement[0]?.length || 0;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const student = arrangement[row][col];
      if (!student) continue;
      
      // Check adjacent positions for conflicts
      const adjacentPositions = [
        [row, col - 1], [row, col + 1], // horizontal
        [row - 1, col], [row + 1, col], // vertical
        [row - 1, col - 1], [row - 1, col + 1], // diagonal
        [row + 1, col - 1], [row + 1, col + 1]
      ];
      
      adjacentPositions.forEach(([adjRow, adjCol]) => {
        if (adjRow >= 0 && adjRow < rows && adjCol >= 0 && adjCol < cols) {
          const adjacentStudent = arrangement[adjRow][adjCol];
          if (adjacentStudent) {
            // Same branch penalty (higher for horizontal)
            if (student.branch === adjacentStudent.branch) {
              if (adjRow === row) { // horizontal
                totalScore += 100;
              } else {
                totalScore += 20;
              }
            }
            
            // Same subject penalty (considering different branches might have same subjects)
            if (student.subject === adjacentStudent.subject && student.branch !== adjacentStudent.branch) {
              totalScore += 10;
            }
          }
        }
      });
    }
  }
  
  return totalScore;
}

// Generate a single simple arrangement attempt - Column-wise by branch with constraints
function generateSimpleArrangementAttempt(students: Student[], room: Room, seed: number): (Student | null)[][] {
  const rows = room.rows;
  const cols = room.columns;
  const seating: (Student | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

  if (students.length === 0) return seating;

  // Group students by branch
  const branchGroups: Record<string, Student[]> = {};
  
  students.forEach(student => {
    if (!branchGroups[student.branch]) {
      branchGroups[student.branch] = [];
    }
    branchGroups[student.branch].push(student);
  });

  // Sort each branch by roll number
  Object.keys(branchGroups).forEach(branch => {
    branchGroups[branch].sort((a, b) => {
      const rollA = parseInt(a.roll.replace(/\D/g, '')) || 0;
      const rollB = parseInt(b.roll.replace(/\D/g, '')) || 0;
      return rollA - rollB;
    });
  });

  const branches = Object.keys(branchGroups);
  

  // Track which columns are used by which branch to avoid consecutive same-branch columns
  const columnBranchMap: (string | null)[] = Array(cols).fill(null);
  
  // Process each branch and allocate columns
  for (const branch of branches) {
    const branchStudents = branchGroups[branch];
    let studentIndex = 0;
    
    while (studentIndex < branchStudents.length) {
      // Find the next available column that doesn't violate the consecutive constraint
      let targetColumn = -1;
      
      for (let col = 0; col < cols; col++) {
        if (columnBranchMap[col] === null) { // Column is empty
          // Check if placing this branch here violates consecutive constraint
          const leftBranch = col > 0 ? columnBranchMap[col - 1] : null;
          const rightBranch = col < cols - 1 ? columnBranchMap[col + 1] : null;
          
          if (leftBranch !== branch && rightBranch !== branch) {
            targetColumn = col;
            break;
          }
        } else if (columnBranchMap[col] === branch) {
          // This column already has students from this branch - check if it has space
          let hasSpace = false;
          for (let row = 0; row < rows; row++) {
            if (seating[row][col] === null) {
              hasSpace = true;
              break;
            }
          }
          if (hasSpace) {
            targetColumn = col;
            break;
          }
        }
      }
      
      if (targetColumn === -1) {
        // No valid column found, break out
        
        break;
      }
      
      // Mark this column as belonging to this branch
      columnBranchMap[targetColumn] = branch;
      
      // Fill the column with students from this branch
      for (let row = 0; row < rows && studentIndex < branchStudents.length; row++) {
        if (seating[row][targetColumn] === null) {
          seating[row][targetColumn] = branchStudents[studentIndex];
          studentIndex++;
        }
      }
      
      
    }
  }

  // Count total students placed
  let studentsPlaced = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (seating[row][col] !== null) studentsPlaced++;
    }
  }
  
  return seating;
}
        
// Simplified allocation - removed for performance, direct placement is more efficient

// Optimized function for handling large datasets - Proper branch analysis and distribution
function arrangeStudentsSimpleWithSeed(
  students: Student[], 
  room: Room, 
  seed: number, 
  allocationLimit: number
): { seating: (Student | null)[][], removedStudents: Student[] } {
  // Early return for empty input
  if (students.length === 0 || allocationLimit <= 0) {
    return {
      seating: Array.from({ length: room.rows }, () => Array(room.columns).fill(null)),
      removedStudents: [...students]
    };
  }

  

  // Step 1: Analyze branch structure from input data
  const branchAnalysis = analyzeBranchCapacity(students);
  const roomCapacity = Math.min(room.rows * room.columns, allocationLimit);
  
  
  // Step 2: Calculate optimal branch distribution for this room
  const branchDistribution = calculateOptimalBranchDistribution(
    branchAnalysis, 
    roomCapacity, 
    room.columns
  );
  
  

  // Step 3: Execute the optimized placement strategy
  const result = executeBranchDistributionPlan(
    students,
    room,
    branchDistribution,
    allocationLimit
  );

  

  return result;
}

// Analyze branch capacity and structure from input data
function analyzeBranchCapacity(students: Student[]): {
  branches: string[];
  branchCounts: Map<string, number>;
  totalStudents: number;
  summary: { [branch: string]: number };
} {
  const branchCounts = new Map<string, number>();
  const summary: { [branch: string]: number } = {};
  
  // Single pass analysis
  for (const student of students) {
    const count = branchCounts.get(student.branch) || 0;
    branchCounts.set(student.branch, count + 1);
    summary[student.branch] = count + 1;
  }
  
  const branches = Array.from(branchCounts.keys()).sort();
  
  return {
    branches,
    branchCounts,
    totalStudents: students.length,
    summary
  };
}

// Calculate optimal branch distribution for a room
function calculateOptimalBranchDistribution(
  branchAnalysis: ReturnType<typeof analyzeBranchCapacity>,
  roomCapacity: number,
  columns: number
): {
  branchAllocations: Map<string, number>;
  columnsPerBranch: Map<string, number>;
  totalAllocated: number;
} {
  const { branches, branchCounts, totalStudents } = branchAnalysis;
  const branchAllocations = new Map<string, number>();
  const columnsPerBranch = new Map<string, number>();
  
  // Calculate proportional allocation based on branch sizes
  let totalAllocated = 0;
  
  for (const branch of branches) {
    const branchSize = branchCounts.get(branch)!;
    const proportion = branchSize / totalStudents;
    const allocation = Math.min(
      Math.floor(proportion * roomCapacity),
      branchSize // Don't allocate more than available
    );
    
    branchAllocations.set(branch, allocation);
    totalAllocated += allocation;
    
    // Calculate columns needed for this branch
    const columnsNeeded = Math.ceil(allocation / (roomCapacity / columns));
    columnsPerBranch.set(branch, Math.min(columnsNeeded, columns));
  }
  
  // Distribute remaining capacity if any
  const remaining = roomCapacity - totalAllocated;
  if (remaining > 0) {
    // Give remaining seats to branches with most students first
    const sortedBranches = branches.sort((a, b) => 
      branchCounts.get(b)! - branchCounts.get(a)!
    );
    
    let remainingToDistribute = remaining;
    for (const branch of sortedBranches) {
      if (remainingToDistribute <= 0) break;
      
      const currentAllocation = branchAllocations.get(branch)!;
      const branchCapacity = branchCounts.get(branch)!;
      const canAdd = Math.min(remainingToDistribute, branchCapacity - currentAllocation);
      
      if (canAdd > 0) {
        branchAllocations.set(branch, currentAllocation + canAdd);
        totalAllocated += canAdd;
        remainingToDistribute -= canAdd;
        
        // Recalculate columns needed
        const newAllocation = branchAllocations.get(branch)!;
        const columnsNeeded = Math.ceil(newAllocation / (roomCapacity / columns));
        columnsPerBranch.set(branch, Math.min(columnsNeeded, columns));
      }
    }
  }
  
  return {
    branchAllocations,
    columnsPerBranch,
    totalAllocated
  };
}

// Execute the branch distribution plan with anti-consecutive placement
function executeBranchDistributionPlan(
  students: Student[],
  room: Room,
  distribution: ReturnType<typeof calculateOptimalBranchDistribution>,
  allocationLimit: number
): { seating: (Student | null)[][], removedStudents: Student[], placedCount: number } {
  const seating: (Student | null)[][] = Array.from(
    { length: room.rows }, 
    () => Array(room.columns).fill(null)
  );

  // Group and sort students by branch
  const branchGroups = new Map<string, Student[]>();
  for (const student of students) {
    if (!branchGroups.has(student.branch)) {
      branchGroups.set(student.branch, []);
    }
    branchGroups.get(student.branch)!.push(student);
  }

  // Sort each branch by roll number
  for (const branchStudents of branchGroups.values()) {
    branchStudents.sort((a, b) => {
      const rollA = parseInt(a.roll.replace(/\D/g, '')) || 0;
      const rollB = parseInt(b.roll.replace(/\D/g, '')) || 0;
      return rollA - rollB;
    });
  }

  // Execute column-wise placement following the distribution plan
  const { branchAllocations } = distribution;
  const columnAssignments: string[] = []; // Track which branch owns each column
  let currentColumn = 0;
  let totalPlaced = 0;

  // Place branches column by column ensuring no consecutive same-branch columns
  for (const [branch, allocation] of branchAllocations.entries()) {
    if (allocation === 0 || currentColumn >= room.columns) continue;
    
    const branchStudents = branchGroups.get(branch)!;
    let branchPlaced = 0;
    
    while (branchPlaced < allocation && currentColumn < room.columns && totalPlaced < allocationLimit) {
      // Check if this column placement violates consecutive constraint
      const canPlaceHere = currentColumn === 0 || 
                          columnAssignments[currentColumn - 1] !== branch;
      
      if (!canPlaceHere) {
        // Skip this column or find alternative placement strategy
        currentColumn++;
        continue;
      }
      
      // Fill current column with students from this branch
      columnAssignments[currentColumn] = branch;
      const studentsInThisColumn = Math.min(
        room.rows,
        allocation - branchPlaced,
        allocationLimit - totalPlaced,
        branchStudents.length - branchPlaced
      );
      
      for (let row = 0; row < studentsInThisColumn; row++) {
        const studentIndex = branchPlaced + row;
        if (studentIndex < branchStudents.length) {
          seating[row][currentColumn] = branchStudents[studentIndex];
          totalPlaced++;
        }
      }
      
      branchPlaced += studentsInThisColumn;
      currentColumn++;
    }
    
    
  }

  // Collect remaining students
  const removedStudents: Student[] = [];
  for (const [branch, allocation] of branchAllocations.entries()) {
    const branchStudents = branchGroups.get(branch)!;
    removedStudents.push(...branchStudents.slice(allocation));
  }

  // Add students from branches that weren't allocated
  for (const [branch, branchStudents] of branchGroups.entries()) {
    if (!branchAllocations.has(branch)) {
      removedStudents.push(...branchStudents);
    }
  }

  
  
  return {
    seating,
    removedStudents,
    placedCount: totalPlaced
  };
}


// Calculate total conflict score for an entire room arrangement
function calculateRoomConflictScore(roomStudents: (Student | null)[][]): number {
  let totalScore = 0;
  const rows = roomStudents.length;
  const cols = roomStudents[0]?.length || 0;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const student = roomStudents[row][col];
      if (student) {
        totalScore += calculateEnhancedConflictScore(roomStudents, row, col, student, rows, cols);
      }
    }
  }
  
  return totalScore;
}

// Enhanced subject-based arrangement with round-robin distribution and hill-climbing optimization
function generateEnhancedArrangementAttempt(
  students: Student[], 
  room: Room, 
  seed: number
): (Student | null)[][] {
  if (students.length === 0) {
    return Array(room.rows).fill(null).map(() => Array(room.columns).fill(null));
  }
  
  // Step 1: Group students by subject first, then by branch
  const subjectGroups = groupStudentsBySubject(students);
  const subjects = Object.keys(subjectGroups);
  
  // Step 5: Check if all students have the same subject (fallback to branch-based)
  if (subjects.length === 1) {
    
    return generateBranchBasedArrangement(students, room, seed);
  }
  
  // Step 6: Ensure department sequence - sort students within each subject by branch and roll
  Object.keys(subjectGroups).forEach(subject => {
    subjectGroups[subject] = sortStudentsByBranchAndRoll(subjectGroups[subject]);
  });
  
  // Step 8: Generate initial seating plan with round-robin subject distribution
  let initialArrangement = generateRoundRobinArrangement(subjectGroups, room, seed);
  
  // Step 9: Optimize with hill-climbing algorithm
  const optimizedArrangement = optimizeWithHillClimbing(initialArrangement, room, 100);
  
  return optimizedArrangement;
}

// Group students by subject, maintaining branch and roll order within subjects
function groupStudentsBySubject(students: Student[]): { [subject: string]: Student[] } {
  const subjectGroups: { [subject: string]: Student[] } = {};
  
  students.forEach(student => {
    if (!subjectGroups[student.subject]) {
      subjectGroups[student.subject] = [];
    }
    subjectGroups[student.subject].push(student);
  });
  
  return subjectGroups;
}

// Fallback branch-based arrangement when all students have same subject
function generateBranchBasedArrangement(students: Student[], room: Room, seed: number): (Student | null)[][] {
  const roomStudents: (Student | null)[][] = Array(room.rows).fill(null).map(() => Array(room.columns).fill(null));
  
  // Group by branch and sort by roll number
  const branchGroups: { [branch: string]: Student[] } = {};
  students.forEach(student => {
    if (!branchGroups[student.branch]) {
      branchGroups[student.branch] = [];
    }
    branchGroups[student.branch].push(student);
  });
  
  // Sort within each branch by roll number
  Object.keys(branchGroups).forEach(branch => {
    branchGroups[branch].sort((a, b) => {
      const rollA = parseInt(a.roll.replace(/\D/g, '')) || 0;
      const rollB = parseInt(b.roll.replace(/\D/g, '')) || 0;
      return rollA - rollB;
    });
  });
  
  // Use round-robin distribution by branch
  const branches = Object.keys(branchGroups);
  const branchIndices: { [branch: string]: number } = {};
  branches.forEach(branch => branchIndices[branch] = 0);
  
  let currentBranchIndex = 0;
  
  for (let row = 0; row < room.rows; row++) {
    for (let col = 0; col < room.columns; col++) {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < branches.length) {
        const branch = branches[currentBranchIndex];
        if (branchIndices[branch] < branchGroups[branch].length) {
          const student = branchGroups[branch][branchIndices[branch]];
          const conflictScore = calculateEnhancedConflictScore(roomStudents, row, col, student, room.rows, room.columns);
          
          // Allow placement if conflict score is acceptable for branch-based fallback
          if (conflictScore < Infinity) {
            roomStudents[row][col] = student;
            branchIndices[branch]++;
            placed = true;
          }
        }
        currentBranchIndex = (currentBranchIndex + 1) % branches.length;
        attempts++;
      }
      
      if (!placed) break; // No more students can be placed
    }
  }
  
  return roomStudents;
}

// Generate initial round-robin subject distribution
function generateRoundRobinArrangement(
  subjectGroups: { [subject: string]: Student[] }, 
  room: Room, 
  seed: number
): (Student | null)[][] {
  const roomStudents: (Student | null)[][] = Array(room.rows).fill(null).map(() => Array(room.columns).fill(null));
  const subjects = Object.keys(subjectGroups);
  const subjectIndices: { [subject: string]: number } = {};
  subjects.forEach(subject => subjectIndices[subject] = 0);
  
  let currentSubjectIndex = 0;
  
  // Generate seeded random positions for better distribution
  const positions = generateRandomizedPositions(room.rows, room.columns, seed);
  
  for (const [row, col] of positions) {
    let placed = false;
    let attempts = 0;
    
    // Try to place a student from the current subject, cycling through subjects
    while (!placed && attempts < subjects.length) {
      const subject = subjects[currentSubjectIndex];
      
      if (subjectIndices[subject] < subjectGroups[subject].length) {
        const student = subjectGroups[subject][subjectIndices[subject]];
        const conflictScore = calculateEnhancedConflictScore(
          roomStudents, 
          row, 
          col, 
          student, 
          room.rows, 
          room.columns
        );
        
        // Hard rule enforcement: reject if horizontal same subject
        if (conflictScore < Infinity) {
          roomStudents[row][col] = student;
          subjectIndices[subject]++;
          placed = true;
        }
      }
      
      currentSubjectIndex = (currentSubjectIndex + 1) % subjects.length;
      attempts++;
    }
    
    if (!placed) {
      // Try to place any remaining student if no subject-based placement works
      for (const subject of subjects) {
        if (subjectIndices[subject] < subjectGroups[subject].length) {
          roomStudents[row][col] = subjectGroups[subject][subjectIndices[subject]];
          subjectIndices[subject]++;
          break;
        }
      }
    }
  }
  
  return roomStudents;
}

// Hill-climbing optimization: swap seats to reduce conflict score
function optimizeWithHillClimbing(
  arrangement: (Student | null)[][],
  room: Room,
  maxIterations: number
): (Student | null)[][] {
  let currentArrangement = arrangement.map(row => [...row]);
  let currentScore = calculateRoomConflictScore(currentArrangement);
  let improvements = 0;
  
  
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let bestImprovement = 0;
    let bestSwap: { pos1: [number, number], pos2: [number, number] } | null = null;
    
    // Find all occupied positions
    const occupiedPositions: [number, number][] = [];
    for (let row = 0; row < room.rows; row++) {
      for (let col = 0; col < room.columns; col++) {
        if (currentArrangement[row][col] !== null) {
          occupiedPositions.push([row, col]);
        }
      }
    }
    
    // Try swapping every pair of students
    for (let i = 0; i < occupiedPositions.length; i++) {
      for (let j = i + 1; j < occupiedPositions.length; j++) {
        const pos1 = occupiedPositions[i];
        const pos2 = occupiedPositions[j];
        
        // Calculate score before swap
        const scoreBefore = calculatePositionConflictScore(currentArrangement, pos1[0], pos1[1], room) +
                           calculatePositionConflictScore(currentArrangement, pos2[0], pos2[1], room);
        
        // Perform swap
        const temp = currentArrangement[pos1[0]][pos1[1]];
        currentArrangement[pos1[0]][pos1[1]] = currentArrangement[pos2[0]][pos2[1]];
        currentArrangement[pos2[0]][pos2[1]] = temp;
        
        // Calculate score after swap
        const scoreAfter = calculatePositionConflictScore(currentArrangement, pos1[0], pos1[1], room) +
                          calculatePositionConflictScore(currentArrangement, pos2[0], pos2[1], room);
        
        const improvement = scoreBefore - scoreAfter;
        
        if (improvement > bestImprovement) {
          bestImprovement = improvement;
          bestSwap = { pos1, pos2 };
        }
        
        // Revert swap
        currentArrangement[pos2[0]][pos2[1]] = currentArrangement[pos1[0]][pos1[1]];
        currentArrangement[pos1[0]][pos1[1]] = temp;
      }
    }
    
    // Apply best swap if it improves the score
    if (bestSwap && bestImprovement > 0) {
      const temp = currentArrangement[bestSwap.pos1[0]][bestSwap.pos1[1]];
      currentArrangement[bestSwap.pos1[0]][bestSwap.pos1[1]] = currentArrangement[bestSwap.pos2[0]][bestSwap.pos2[1]];
      currentArrangement[bestSwap.pos2[0]][bestSwap.pos2[1]] = temp;
      
      currentScore -= bestImprovement;
      improvements++;
      
      
    } else {
      // No improvement found, stop early
      break;
    }
  }
  
  
  return currentArrangement;
}

// Calculate conflict score for a specific position
function calculatePositionConflictScore(
  arrangement: (Student | null)[][],
  row: number,
  col: number,
  room: Room
): number {
  const student = arrangement[row][col];
  if (!student) return 0;
  
  return calculateEnhancedConflictScore(arrangement, row, col, student, room.rows, room.columns);
}

// Enhanced anti-cheating seating arrangement with multiple attempts and best selection
function arrangeStudentsAntiCheating(students: Student[], room: Room): (Student | null)[][] {
  return arrangeStudentsAntiCheatWithSeed(students, room, Date.now());
}

// Enhanced anti-cheating seating arrangement with seed for unique arrangements
function arrangeStudentsAntiCheatWithSeed(students: Student[], room: Room, seed: number): (Student | null)[][] {
  if (students.length === 0) {
    return Array(room.rows).fill(null).map(() => Array(room.columns).fill(null));
  }
  
  const attempts: { arrangement: (Student | null)[][], score: number }[] = [];
  const numAttempts = 3; // Generate 3 different arrangements
  
  // Generate multiple arrangement attempts using enhanced algorithm
  for (let attempt = 0; attempt < numAttempts; attempt++) {
    const arrangement = generateEnhancedArrangementAttempt(students, room, seed + attempt * 100);
    const score = calculateRoomConflictScore(arrangement);
    
    attempts.push({ arrangement, score });
  }
  
  // Step 10: Always return the arrangement with the lowest conflict score
  const bestArrangement = attempts.reduce((best, current) => 
    current.score < best.score ? current : best
  );
  
  
  
  return bestArrangement.arrangement;
}

// Enhanced validation for anti-cheating arrangement with detailed rule checking
function validateAntiCheatingArrangement(roomStudents: (Student | null)[][]): {
  isValid: boolean;
  violations: number;
  details: string[];
} {
  let violations = 0;
  const details: string[] = [];
  const rows = roomStudents.length;
  const cols = roomStudents[0]?.length || 0;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const student = roomStudents[row][col];
      if (!student) continue;
      
      // Check horizontal adjacency (STRICT RULE)
      const horizontalPositions = [
        [row, col - 1], // left
        [row, col + 1]  // right
      ];
      
      horizontalPositions.forEach(([adjRow, adjCol]) => {
        if (adjRow >= 0 && adjRow < rows && adjCol >= 0 && adjCol < cols) {
          const adjacentStudent = roomStudents[adjRow][adjCol];
          if (adjacentStudent && student.branch === adjacentStudent.branch) {
            violations++;
            details.push(`HORIZONTAL VIOLATION: ${student.roll} (${student.branch}) horizontally adjacent to ${adjacentStudent.roll} at (${row},${col}) and (${adjRow},${adjCol})`);
          }
        }
      });
      
      // Check vertical and diagonal adjacency (with consecutive roll rule)
      const verticalDiagonalPositions = [
        [row - 1, col - 1], [row - 1, col], [row - 1, col + 1], // top row
        [row + 1, col - 1], [row + 1, col], [row + 1, col + 1]  // bottom row
      ];
      
      verticalDiagonalPositions.forEach(([adjRow, adjCol]) => {
        if (adjRow >= 0 && adjRow < rows && adjCol >= 0 && adjCol < cols) {
          const adjacentStudent = roomStudents[adjRow][adjCol];
          if (adjacentStudent && student.branch === adjacentStudent.branch) {
            const roll1 = parseInt(student.roll.replace(/\D/g, '')) || 0;
            const roll2 = parseInt(adjacentStudent.roll.replace(/\D/g, '')) || 0;
            
            if (Math.abs(roll1 - roll2) <= 1) {
              violations++;
              details.push(`CONSECUTIVE ROLL VIOLATION: ${student.roll} (${student.branch}) adjacent to ${adjacentStudent.roll} with consecutive rolls at (${row},${col}) and (${adjRow},${adjCol})`);
            }
          }
        }
      });
    }
  }
  
  return {
    isValid: violations >= 0,
    violations: violations / 2, // Divide by 2 as each violation is counted twice
    details
  };
}

// Generate seating arrangement for all selected rooms with allocation mode support
export function generateSeatingArrangement(
  students: Student[], 
  selectedRooms: Room[], 
  invigilators: string[],
  allocationMode: AllocationMode,
  arrangementMode: ArrangementMode = 'complex',
  generationSeed?: number, // Add optional seed for unique arrangements
  branchSubjects?: {[branch: string]: {subject: string, subjectTitle: string}}, // Add optional branch-subject mapping
  onProgress?: (progress: number, step: string, studentsProcessed: number, roomsCompleted: number) => void
): SeatingArrangement[] {
  
  // Add subject information to students if branchSubjects mapping is provided
  const enrichedStudents = students.map(student => ({
  ...student,
  subject: student.subject
}));

  const arrangements: SeatingArrangement[] = [];

  // Sort rooms by priority (lower number = higher priority)
  const sortedRooms = [...selectedRooms].sort((a, b) => (a.priority || 999) - (b.priority || 999));

  // Shuffle invigilators for random assignment
  const shuffledInvigilators = shuffleArray(invigilators);

  if (arrangementMode === 'simple') {
    // Simple mode: Use the new 3-step approach with student recycling
    let remainingStudents = [...enrichedStudents];
    
    sortedRooms.forEach((room, roomIndex) => {
      if (remainingStudents.length === 0) return;
      
      const invigilator = shuffledInvigilators[roomIndex % shuffledInvigilators.length];
      
      // Calculate allocation limit for this room
      let allocatedSeats = 0;
      
      if (room.type === 'Seminar Hall') {
        allocatedSeats = Math.min(room.customAllotment || 0, room.rows * room.columns);
      } else {
        if (allocationMode.type === 'even') {
          if (allocationMode.evenType === 'default') {
            allocatedSeats = Math.min(24, room.rows * room.columns);
          } else if (allocationMode.evenType === 'max') {
            allocatedSeats = room.rows * room.columns;
          } else if (allocationMode.evenType === 'custom' && allocationMode.customNumber) {
            allocatedSeats = Math.min(allocationMode.customNumber, room.rows * room.columns);
          } else {
            allocatedSeats = Math.min(24, room.rows * room.columns);
          }
        } else if (allocationMode.type === 'customised') {
          allocatedSeats = Math.min(room.customAllotment || room.rows * room.columns, room.rows * room.columns);
        }
      }
      
      
      
      const roomSeed = (generationSeed || Date.now()) + roomIndex * 1000;
      const result = arrangeStudentsSimpleWithSeed(remainingStudents, room, roomSeed, allocatedSeats);
      
      // Update remaining students by removing those that were kept in the room
      const placedStudents = result.seating.flat().filter(s => s !== null) as Student[];
      
      onProgress?.(
        ((roomIndex + 0.5) / sortedRooms.length) * 100, 
        `Placing students in ${room.name}...`, 
        students.length - remainingStudents.length + placedStudents.length, 
        roomIndex
      );
      remainingStudents = remainingStudents.filter(student => 
        !placedStudents.some(placed => placed.roll === student.roll && placed.branch === student.branch)
      );
      
      // Add removed students back to the pool (ensure they have the same type structure)
      remainingStudents.push(...result.removedStudents.map(student => ({
        ...student,
        subject: branchSubjects?.[student.branch]?.subject || undefined
      })));
      
      
      
      const branchCounts = countStudentsByBranch(result.seating);

      arrangements.push({
        roomId: room.id,
        roomName: room.name,
        students: result.seating,
        branchCounts
      });
    });
    
    } else {
    // Complex mode: Use proportional allocation based on remaining students for each room
    const sortedStudents = sortStudentsByBranchAndRoll(enrichedStudents);
    
    onProgress?.(0, "Initializing complex arrangement...", 0, 0);
    
    // Group students by branch for tracking remaining students
    const remainingStudentsByBranch: { [branch: string]: Student[] } = {};
    sortedStudents.forEach(student => {
      if (!remainingStudentsByBranch[student.branch]) {
        remainingStudentsByBranch[student.branch] = [];
      }
      remainingStudentsByBranch[student.branch].push(student);
    });
    
    const branches = Object.keys(remainingStudentsByBranch).sort();
    
    // Track branch selection to ensure fair distribution
    const branchSelectionCount = new Map<string, number>();
    const branchLastSelectedRoom = new Map<string, number>();
    branches.forEach(branch => {
      branchSelectionCount.set(branch, 0);
      branchLastSelectedRoom.set(branch, -1);
    });

    // MAIN ALLOCATION LOOP - Process each room
    sortedRooms.forEach((room, roomIndex) => {
      onProgress?.(
        (roomIndex / sortedRooms.length) * 90, // Reserve 90-100% for cleanup
        `Processing room ${room.name} (Complex)...`, 
        students.length - Object.values(remainingStudentsByBranch).flat().length, 
        roomIndex
      );
      
      // Check if there are any students left to allocate
      const allAvailableBranches = Object.keys(remainingStudentsByBranch)
        .filter(branch => remainingStudentsByBranch[branch].length > 0);
      
      if (allAvailableBranches.length === 0) {
        console.log(`No more students to allocate for room ${room.name}`);
        return;
      }
      
      // Select 9-12 branches for this room with smart prioritization
      const numBranchesForRoom = Math.min(
        Math.floor(Math.random() * 2) + 3, // Random number between 3-4
        allAvailableBranches.length
      );
      
      // Smart branch selection: prioritize branches with more students and fair distribution
      const branchPriorities = allAvailableBranches.map(branch => {
        const remainingCount = remainingStudentsByBranch[branch].length;
        const selectionCount = branchSelectionCount.get(branch) || 0;
        const lastSelectedRoom = branchLastSelectedRoom.get(branch) || -999;
        const roomsSinceLastSelection = roomIndex - lastSelectedRoom;
        
        // Priority score calculation
        let priorityScore = 0;
        
        // Small branches get highest priority
        if (remainingCount <= 5) {
          priorityScore += 10000;
          priorityScore += (6 - remainingCount) * 1000;
        } else {
          priorityScore += Math.min(remainingCount * 10, 500);
        }
        
        // Boost branches not selected recently
        priorityScore += (roomsSinceLastSelection * 50);
        
        // Penalize frequently selected branches
        priorityScore += ((10 - selectionCount) * 30);
        
        return {
          branch,
          remainingCount,
          selectionCount,
          roomsSinceLastSelection,
          priorityScore
        };
      }).sort((a, b) => b.priorityScore - a.priorityScore);
      
      // Select top candidates with some randomization
      const topCandidates = branchPriorities.slice(0, Math.min(numBranchesForRoom * 2, branchPriorities.length));
      const selectedBranchesForRoom = topCandidates
        .sort(() => Math.random() - 0.5)
        .slice(0, numBranchesForRoom)
        .map(item => item.branch);
      
      // Update tracking
      selectedBranchesForRoom.forEach(branch => {
        branchSelectionCount.set(branch, (branchSelectionCount.get(branch) || 0) + 1);
        branchLastSelectedRoom.set(branch, roomIndex);
      });
      
      console.log(`Room ${room.name}: Selected ${selectedBranchesForRoom.length} branches from ${allAvailableBranches.length} available`);
      
      // Calculate allocation limit for this room
      let allocatedSeats = 0;
      
      if (room.type === 'Seminar Hall') {
        allocatedSeats = Math.min(room.customAllotment || 0, room.rows * room.columns);
      } else {
        if (allocationMode.type === 'even') {
          if (allocationMode.evenType === 'default') {
            allocatedSeats = Math.min(24, room.rows * room.columns);
          } else if (allocationMode.evenType === 'max') {
            allocatedSeats = room.rows * room.columns;
          } else if (allocationMode.evenType === 'custom' && allocationMode.customNumber) {
            allocatedSeats = Math.min(allocationMode.customNumber, room.rows * room.columns);
          } else {
            allocatedSeats = Math.min(24, room.rows * room.columns);
          }
        } else if (allocationMode.type === 'customised') {
          allocatedSeats = Math.min(room.customAllotment || room.rows * room.columns, room.rows * room.columns);
        }
      }
      
      // Calculate proportional allocation for selected branches
      const totalRemainingStudents = selectedBranchesForRoom
        .reduce((sum, branch) => sum + remainingStudentsByBranch[branch].length, 0);
      
      if (totalRemainingStudents === 0) {
        console.log(`No students available in selected branches for room ${room.name}`);
        return;
      }
      
      // Calculate each branch's allocation
      const branchAllocations: { [branch: string]: { expected: number; base: number; remainder: number } } = {};
      let totalBaseAllocated = 0;
      
      selectedBranchesForRoom.forEach(branch => {
        const branchRemainingCount = remainingStudentsByBranch[branch].length;
        const share = branchRemainingCount / totalRemainingStudents;
        const expected = share * allocatedSeats;
        const base = Math.floor(expected);
        const remainder = expected - base;
        
        branchAllocations[branch] = { expected, base, remainder };
        totalBaseAllocated += base;
      });
      
      // Distribute leftover seats based on largest fractional remainders
      const leftoverSeats = allocatedSeats - totalBaseAllocated;
      const sortedByRemainder = selectedBranchesForRoom
        .filter(branch => remainingStudentsByBranch[branch].length > 0)
        .sort((a, b) => branchAllocations[b].remainder - branchAllocations[a].remainder);
      
      for (let i = 0; i < leftoverSeats && i < sortedByRemainder.length; i++) {
        const branch = sortedByRemainder[i];
        branchAllocations[branch].base += 1;
      }
      
      // Allocate students for this room
      const studentsForRoom: Student[] = [];
      
      selectedBranchesForRoom.forEach(branch => {
        const slotsForThisBranch = branchAllocations[branch].base;
        const availableStudents = remainingStudentsByBranch[branch].length;
        const studentsToTake = Math.min(slotsForThisBranch, availableStudents);
        
        for (let i = 0; i < studentsToTake; i++) {
          const student = remainingStudentsByBranch[branch].shift();
          if (student) {
            studentsForRoom.push(student);
          }
        }
      });
      
      console.log(`Room ${room.name}: Allocated ${studentsForRoom.length} students from selected branches`);
      
      // Generate seating arrangement for this room
      const roomSeed = (generationSeed || Date.now()) + roomIndex * 1000;
      const roomStudents = arrangeStudentsAntiCheatWithSeed(studentsForRoom, room, roomSeed);
      
      const validation = validateAntiCheatingArrangement(roomStudents);
      const branchCounts = countStudentsByBranch(roomStudents);

      arrangements.push({
        roomId: room.id,
        roomName: room.name,
        students: roomStudents,
        branchCounts
      });
      
      onProgress?.(
        ((roomIndex + 1) / sortedRooms.length) * 90, // Reserve 90-100% for cleanup
        `Completed room ${room.name} (Complex)`, 
        students.length - Object.values(remainingStudentsByBranch).flat().length, 
        roomIndex + 1
      );
    });

    // CLEANUP PASS - Allocate any remaining students to rooms with available capacity
    const finalRemainingStudents = Object.values(remainingStudentsByBranch).flat();
    
    if (finalRemainingStudents.length > 0) {
      console.warn(`⚠️ ${finalRemainingStudents.length} students remaining after initial allocation`);
      console.warn('Remaining students:', finalRemainingStudents.map(s => `${s.branch}-${s.roll}`).join(', '));
      
      onProgress?.(
        95, 
        `Allocating remaining ${finalRemainingStudents.length} students...`, 
        students.length - finalRemainingStudents.length, 
        sortedRooms.length
      );
      
      // Find rooms with available capacity
      const roomsWithCapacity = arrangements.map((arrangement, idx) => {
        const room = sortedRooms[idx];
        let currentOccupancy = 0;
        
        for (let row = 0; row < arrangement.students.length; row++) {
          for (let col = 0; col < arrangement.students[row].length; col++) {
            if (arrangement.students[row][col] !== null) currentOccupancy++;
          }
        }
        
        const maxCapacity = room.rows * room.columns;
        const availableCapacity = maxCapacity - currentOccupancy;
        
        return {
          roomIndex: idx,
          room,
          arrangement,
          currentOccupancy,
          maxCapacity,
          availableCapacity
        };
      }).filter(r => r.availableCapacity > 0)
        .sort((a, b) => b.availableCapacity - a.availableCapacity);
      
      console.log(`Found ${roomsWithCapacity.length} rooms with available capacity:`, 
        roomsWithCapacity.map(r => `${r.room.name}(${r.availableCapacity} seats)`).join(', '));
      
      // Distribute remaining students
      let studentsStillRemaining = [...finalRemainingStudents];
      let placedInCleanup = 0;
      
      for (const roomInfo of roomsWithCapacity) {
        if (studentsStillRemaining.length === 0) break;
        
        const studentsToAdd = studentsStillRemaining.splice(
          0, 
          Math.min(roomInfo.availableCapacity, studentsStillRemaining.length)
        );
        
        console.log(`📍 Adding ${studentsToAdd.length} students to ${roomInfo.room.name}`);
        
        // Get all current students in this room
        const allStudentsInRoom = roomInfo.arrangement.students.flat()
          .filter(s => s !== null) as Student[];
        allStudentsInRoom.push(...studentsToAdd);
        placedInCleanup += studentsToAdd.length;
        
        // Re-arrange this room with additional students
        const roomSeed = (generationSeed || Date.now()) + roomInfo.roomIndex * 1000 + 999999;
        const newArrangement = arrangeStudentsAntiCheatWithSeed(allStudentsInRoom, roomInfo.room, roomSeed);
        
        // Update arrangement
        roomInfo.arrangement.students = newArrangement;
        roomInfo.arrangement.branchCounts = countStudentsByBranch(newArrangement);
        
        console.log(`✅ ${roomInfo.room.name} cleanup complete: ${allStudentsInRoom.length} students total`);
      }
      
      console.log(`Cleanup summary: Placed ${placedInCleanup} students, ${studentsStillRemaining.length} remaining`);
      
      if (studentsStillRemaining.length > 0) {
        console.error(`❌ CRITICAL: ${studentsStillRemaining.length} students could not be allocated!`);
        console.error('Unallocated students:', studentsStillRemaining.map(s => `${s.branch}-${s.roll}`).join(', '));
      } else {
        console.log(`✅ SUCCESS: All ${students.length} students successfully allocated!`);
        console.log(`   Initial allocation: ${students.length - placedInCleanup} students`);
        console.log(`   Cleanup allocation: ${placedInCleanup} students`);
      }
    } else {
      console.log(`✅ PERFECT: All students placed in initial allocation round!`);
    }
    
    onProgress?.(100, "Complex arrangement generation complete!", students.length, sortedRooms.length);
  }
    
    return arrangements;
  }

