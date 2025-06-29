import React from "react";
import { cookies } from "next/headers";
import { PrismaClient } from '@prisma/client';
import StaffShiftsClient from "./StaffShiftsClient";
import { calculateReliabilityScore } from "@/lib/reliability";

export default async function StaffShiftsPage() {
  // Get session from cookie
  const cookieStore = await cookies();
  const cookie = cookieStore.get('session')?.value;
  let user = null;
  if (cookie) {
    try {
      user = JSON.parse(cookie);
    } catch {}
  }
  // Fetch open shifts
  const prisma = new PrismaClient();
  const openShifts = await prisma.shift.findMany({
    where: { status: 'OPEN', assignedToId: null },
    include: {
      callOutLogs: { include: { user: true } },
    },
    orderBy: { start: 'asc' },
  });
  
  // Fetch assigned shifts for current user
  const assignedShifts = user ? await prisma.shift.findMany({
    where: { assignedToId: user.id },
    include: {
      callOutLogs: { include: { user: true } },
    },
    orderBy: { start: 'asc' },
  }) as any[] : [];

  // Get reliability stats for the current user
  const reliabilityStats = user ? await calculateReliabilityScore(user.id) : null;

  return (
    <StaffShiftsClient 
      initialOpenShifts={openShifts} 
      initialAssignedShifts={assignedShifts} 
      user={user}
      reliabilityStats={reliabilityStats}
    />
  );
}