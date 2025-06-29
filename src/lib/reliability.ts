import { PrismaClient } from '@prisma/client';

export interface ReliabilityStats {
  score: number;
  totalShifts: number;
  completedShifts: number;
  missedShifts: number;
  avgResponseTimeMinutes: number;
  completionRate: number;
}

export async function calculateReliabilityScore(userId: number): Promise<ReliabilityStats> {
  const prisma = new PrismaClient();
  
  try {
    // Get all call-out logs where this user accepted shifts
    const acceptedLogs = await prisma.callOutLog.findMany({
      where: {
        acceptedById: userId,
      },
      include: {
        shift: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    const totalShifts = acceptedLogs.length;
    
    if (totalShifts === 0) {
      return {
        score: 1.0,
        totalShifts: 0,
        completedShifts: 0,
        missedShifts: 0,
        avgResponseTimeMinutes: 0,
        completionRate: 0,
      };
    }

    // Calculate metrics
    const missedShifts = acceptedLogs.filter(log => log.missed).length;
    const completedShifts = totalShifts - missedShifts;
    const completionRate = completedShifts / totalShifts;

    // Calculate average response time
    const responseTimes = acceptedLogs
      .filter(log => log.respondedAt)
      .map(log => {
        const calloutTime = new Date(log.timestamp).getTime();
        const responseTime = new Date(log.respondedAt!).getTime();
        return (responseTime - calloutTime) / (1000 * 60); // Convert to minutes
      });

    const avgResponseTimeMinutes = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    // Calculate reliability score (0.0 to 1.0)
    let score = 1.0;

    // Factor 1: Completion rate (70% weight)
    score *= (0.3 + (completionRate * 0.7));

    // Factor 2: Response time (30% weight)
    // Ideal response time is under 5 minutes, penalize longer times
    const responseTimeFactor = Math.max(0.1, Math.min(1.0, 1 - (avgResponseTimeMinutes - 5) / 60));
    score *= (0.7 + (responseTimeFactor * 0.3));

    // Ensure score is between 0 and 1
    score = Math.max(0.0, Math.min(1.0, score));

    return {
      score,
      totalShifts,
      completedShifts,
      missedShifts,
      avgResponseTimeMinutes: Math.round(avgResponseTimeMinutes * 10) / 10,
      completionRate: Math.round(completionRate * 100) / 100,
    };
  } finally {
    await prisma.$disconnect();
  }
}

export async function updateUserReliabilityScore(userId: number): Promise<void> {
  const prisma = new PrismaClient();
  
  try {
    const stats = await calculateReliabilityScore(userId);
    
    await prisma.user.update({
      where: { id: userId },
      data: { reliabilityScore: stats.score },
    });
  } finally {
    await prisma.$disconnect();
  }
}

export function getReliabilityColor(score: number): string {
  if (score >= 0.8) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

export function getReliabilityLabel(score: number): string {
  if (score >= 0.9) return 'Excellent';
  if (score >= 0.8) return 'Good';
  if (score >= 0.6) return 'Fair';
  return 'Needs Improvement';
}

export function formatResponseTime(minutes: number): string {
  if (minutes < 1) return '< 1m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
} 