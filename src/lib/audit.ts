import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type ActionType = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'SHIFT_ACCEPTED'
  | 'SHIFT_MISSED'
  | 'SHIFT_CANCELLED'
  | 'CALLOUT_CREATED'
  | 'CALLOUT_CANCELLED'
  | 'SHIFT_REASSIGNED'
  | 'USER_ACTIVATED'
  | 'USER_DEACTIVATED'
  | 'USER_SUSPENDED'
  | 'PROFILE_UPDATED';

export interface AuditLogData {
  userId: number;
  actionType: ActionType;
  actionDetail: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        actionType: data.actionType,
        actionDetail: data.actionDetail,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking the main functionality
  }
}

export async function getUserAuditLogs(userId: number, limit: number = 50) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });
    return logs;
  } catch (error) {
    console.error('Failed to fetch user audit logs:', error);
    return [];
  }
}

export async function getAllAuditLogs(limit: number = 100) {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });
    return logs;
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }
}

export function getActionTypeLabel(actionType: ActionType): string {
  const labels: Record<ActionType, string> = {
    LOGIN: 'User Login',
    LOGOUT: 'User Logout',
    SHIFT_ACCEPTED: 'Shift Accepted',
    SHIFT_MISSED: 'Shift Missed',
    SHIFT_CANCELLED: 'Shift Cancelled',
    CALLOUT_CREATED: 'Call-out Created',
    CALLOUT_CANCELLED: 'Call-out Cancelled',
    SHIFT_REASSIGNED: 'Shift Reassigned',
    USER_ACTIVATED: 'User Activated',
    USER_DEACTIVATED: 'User Deactivated',
    USER_SUSPENDED: 'User Suspended',
    PROFILE_UPDATED: 'Profile Updated',
  };
  return labels[actionType] || actionType;
}

export function getActionTypeColor(actionType: ActionType): string {
  const colors: Record<ActionType, string> = {
    LOGIN: 'bg-blue-100 text-blue-800',
    LOGOUT: 'bg-gray-100 text-gray-800',
    SHIFT_ACCEPTED: 'bg-green-100 text-green-800',
    SHIFT_MISSED: 'bg-red-100 text-red-800',
    SHIFT_CANCELLED: 'bg-gray-100 text-gray-800',
    CALLOUT_CREATED: 'bg-yellow-100 text-yellow-800',
    CALLOUT_CANCELLED: 'bg-gray-100 text-gray-800',
    SHIFT_REASSIGNED: 'bg-orange-100 text-orange-800',
    USER_ACTIVATED: 'bg-emerald-100 text-emerald-800',
    USER_DEACTIVATED: 'bg-red-100 text-red-800',
    USER_SUSPENDED: 'bg-orange-100 text-orange-800',
    PROFILE_UPDATED: 'bg-purple-100 text-purple-800',
  };
  return colors[actionType] || 'bg-gray-100 text-gray-800';
}

export function getActionTypeIcon(actionType: ActionType): string {
  const icons: Record<ActionType, string> = {
    LOGIN: '🔑',
    LOGOUT: '🚪',
    SHIFT_ACCEPTED: '✅',
    SHIFT_MISSED: '❌',
    SHIFT_CANCELLED: '🚫',
    CALLOUT_CREATED: '📞',
    CALLOUT_CANCELLED: '🚫',
    SHIFT_REASSIGNED: '🔄',
    USER_ACTIVATED: '🟢',
    USER_DEACTIVATED: '🔴',
    USER_SUSPENDED: '⏸️',
    PROFILE_UPDATED: '✏️',
  };
  return icons[actionType] || '📝';
} 