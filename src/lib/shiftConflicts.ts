import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface StaffMember {
  id: number;
  email: string;
  role: string;
  reliabilityScore: number;
  active: boolean;
}

export interface ShiftConflict {
  hasConflict: boolean;
  conflictingShifts: Array<{
    id: number;
    start: Date;
    end: Date;
    requiredSkill: string;
    status: string;
  }>;
}

export interface StaffMatchScore {
  staff: StaffMember;
  score: number;
  hasConflict: boolean;
  reliabilityScore: number;
  skillMatch: boolean;
  conflictingShifts: Array<{
    id: number;
    start: Date;
    end: Date;
    requiredSkill: string;
  }>;
  reasons: string[];
}

export interface SmartSuggestion {
  recommendedStaff: StaffMatchScore[];
  conflictWarnings: string[];
  totalAvailableStaff: number;
  bestMatch?: StaffMatchScore;
}

// Check if two time ranges overlap
export function hasTimeOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1;
}

// Check for shift conflicts for a specific staff member
export async function checkStaffConflicts(
  staffId: number,
  proposedStart: Date,
  proposedEnd: Date
): Promise<ShiftConflict> {
  try {
    const existingShifts = await prisma.shift.findMany({
      where: {
        assignedToId: staffId,
        status: {
          in: ['ASSIGNED', 'OPEN'] // Don't check completed or cancelled shifts
        }
      },
      select: {
        id: true,
        start: true,
        end: true,
        requiredSkill: true,
        status: true,
      }
    });

    const conflictingShifts = existingShifts.filter(shift =>
      hasTimeOverlap(proposedStart, proposedEnd, shift.start, shift.end)
    );

    return {
      hasConflict: conflictingShifts.length > 0,
      conflictingShifts
    };
  } catch (error) {
    console.error('Error checking staff conflicts:', error);
    return { hasConflict: false, conflictingShifts: [] };
  }
}

// Calculate staff match score for a specific shift requirement
export async function calculateStaffMatchScore(
  staff: StaffMember,
  requiredSkill: string,
  shiftStart: Date,
  shiftEnd: Date
): Promise<StaffMatchScore> {
  const conflicts = await checkStaffConflicts(staff.id, shiftStart, shiftEnd);
  
  let score = 0;
  const reasons: string[] = [];

  // Base score from reliability (0-40 points)
  const reliabilityPoints = Math.round(staff.reliabilityScore * 40);
  score += reliabilityPoints;
  if (staff.reliabilityScore >= 0.9) {
    reasons.push('Excellent reliability');
  } else if (staff.reliabilityScore >= 0.8) {
    reasons.push('Good reliability');
  } else if (staff.reliabilityScore >= 0.6) {
    reasons.push('Fair reliability');
  } else {
    reasons.push('Needs improvement in reliability');
  }

  // Skill match (30 points if exact match, 0 if no match)
  const skillMatch = staff.role === 'STAFF'; // Assuming all staff can potentially cover shifts
  if (skillMatch) {
    score += 30;
    reasons.push('Available for assignment');
  } else {
    reasons.push('Not available for shift assignment');
  }

  // No time conflict bonus (30 points)
  if (!conflicts.hasConflict) {
    score += 30;
    reasons.push('No schedule conflicts');
  } else {
    reasons.push(`Has ${conflicts.conflictingShifts.length} conflicting shift(s)`);
  }

  // Active status bonus (10 points)
  if (staff.active) {
    score += 10;
    reasons.push('Active user');
  } else {
    reasons.push('Inactive user');
    score = Math.max(0, score - 50); // Heavy penalty for inactive users
  }

  return {
    staff,
    score: Math.min(100, score), // Cap at 100
    hasConflict: conflicts.hasConflict,
    reliabilityScore: staff.reliabilityScore,
    skillMatch,
    conflictingShifts: conflicts.conflictingShifts,
    reasons
  };
}

// Get smart staff suggestions for a shift
export async function getSmartStaffSuggestions(
  requiredSkill: string,
  shiftStart: Date,
  shiftEnd: Date,
  excludeStaffId?: number
): Promise<SmartSuggestion> {
  try {
    // Get all active staff members
    const allStaff = await prisma.user.findMany({
      where: {
        role: 'STAFF',
        ...(excludeStaffId && { id: { not: excludeStaffId } })
      },
      select: {
        id: true,
        email: true,
        role: true,
        reliabilityScore: true,
        active: true,
      }
    });

    // Calculate match scores for each staff member
    const staffScores = await Promise.all(
      allStaff.map(staff => calculateStaffMatchScore(staff, requiredSkill, shiftStart, shiftEnd))
    );

    // Sort by score (highest first)
    const sortedStaff = staffScores.sort((a, b) => b.score - a.score);

    // Generate conflict warnings
    const conflictWarnings: string[] = [];
    const staffWithConflicts = sortedStaff.filter(s => s.hasConflict);
    
    if (staffWithConflicts.length > 0) {
      conflictWarnings.push(
        `${staffWithConflicts.length} staff member(s) have scheduling conflicts for this time slot`
      );
    }

    const availableStaff = sortedStaff.filter(s => !s.hasConflict && s.staff.active);
    if (availableStaff.length === 0) {
      conflictWarnings.push('No staff members are available without conflicts for this time slot');
    }

    return {
      recommendedStaff: sortedStaff,
      conflictWarnings,
      totalAvailableStaff: availableStaff.length,
      bestMatch: sortedStaff.length > 0 ? sortedStaff[0] : undefined
    };
  } catch (error) {
    console.error('Error getting smart staff suggestions:', error);
    return {
      recommendedStaff: [],
      conflictWarnings: ['Error loading staff suggestions'],
      totalAvailableStaff: 0
    };
  }
}

// Get color indicator for staff match score
export function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (score >= 40) return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

// Get score label
export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent Match';
  if (score >= 60) return 'Good Match';
  if (score >= 40) return 'Fair Match';
  return 'Poor Match';
}

// Get conflict indicator
export function getConflictIndicator(hasConflict: boolean): { icon: string; color: string; label: string } {
  if (hasConflict) {
    return {
      icon: '⚠️',
      color: 'text-red-600',
      label: 'Has Conflicts'
    };
  }
  return {
    icon: '✅',
    color: 'text-green-600',
    label: 'Available'
  };
} 