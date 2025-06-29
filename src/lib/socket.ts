import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest } from 'next';
import { Server as HTTPServer } from 'http';

export interface NotificationData {
  type: 'NEW_SHIFT' | 'SHIFT_ACCEPTED' | 'SHIFT_CANCELLED';
  shiftId: number;
  shift?: {
    id: number;
    requiredSkill: string;
    start: string;
    end: string;
    callOutLogs: Array<{
      user: { email: string };
      reason: string;
    }>;
  };
  acceptedBy?: {
    email: string;
  };
  message: string;
  timestamp: string;
}

export interface SocketUser {
  userId: number;
  role: 'STAFF' | 'MANAGER';
  email: string;
}

declare global {
  var io: SocketIOServer | undefined;
}

export function getSocketIO(): SocketIOServer | null {
  return global.io || null;
}

// Notification utility functions
export function notifyNewShift(shiftData: NotificationData['shift']) {
  const io = getSocketIO();
  if (!io || !shiftData) return;

  const notification: NotificationData = {
    type: 'NEW_SHIFT',
    shiftId: shiftData.id,
    shift: shiftData,
    message: `New ${shiftData.requiredSkill} shift available`,
    timestamp: new Date().toISOString(),
  };

  // Notify all staff members
  io.to('role:STAFF').emit('notification', notification);
  console.log('Sent new shift notification to all staff');
}

export function notifyShiftAccepted(shiftId: number, acceptedBy: { email: string }, shift: any) {
  const io = getSocketIO();
  if (!io) return;

  const notification: NotificationData = {
    type: 'SHIFT_ACCEPTED',
    shiftId,
    acceptedBy,
    shift,
    message: `Shift accepted by ${acceptedBy.email}`,
    timestamp: new Date().toISOString(),
  };

  // Notify all managers
  io.to('role:MANAGER').emit('notification', notification);
  console.log(`Sent shift accepted notification for shift ${shiftId}`);
}

export function notifyShiftCancelled(shiftId: number, shift: any) {
  const io = getSocketIO();
  if (!io) return;

  const notification: NotificationData = {
    type: 'SHIFT_CANCELLED',
    shiftId,
    shift,
    message: `Shift has been cancelled`,
    timestamp: new Date().toISOString(),
  };

  // Notify all staff and managers
  io.emit('notification', notification);
  console.log(`Sent shift cancelled notification for shift ${shiftId}`);
} 