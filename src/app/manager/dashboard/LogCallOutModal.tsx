"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getReliabilityColor } from "@/lib/reliability";
import DateTimePicker from "@/components/ui/date-time-picker";
import SmartStaffSuggestions from "@/components/SmartStaffSuggestions";

interface StaffMember {
  id: number;
  email: string;
  reliabilityScore: number;
}

export default function LogCallOutModal() {
  const [open, setOpen] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [requiredSkill, setRequiredSkill] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();

  // Smart end time calculation
  const handleStartTimeChange = (newStart: string) => {
    setStart(newStart);
    
    // If end time is empty, automatically set it to 8 hours after start time
    if (!end && newStart) {
      const startDate = new Date(newStart);
      const endDate = new Date(startDate.getTime() + 8 * 60 * 60 * 1000); // Add 8 hours
      
      const year = endDate.getFullYear();
      const month = String(endDate.getMonth() + 1).padStart(2, '0');
      const day = String(endDate.getDate()).padStart(2, '0');
      const hours = String(endDate.getHours()).padStart(2, '0');
      const minutes = String(endDate.getMinutes()).padStart(2, '0');
      const endTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
      
      setEnd(endTimeString);
    }
  };

  useEffect(() => {
    if (open) {
      fetch("/api/staff").then(res => res.json()).then(data => {
        // Only show active staff members
        const activeStaff = (data.staff || []).filter((member: any) => 
          member.status === 'ACTIVE' || !member.status // backward compatibility
        );
        setStaff(activeStaff);
      });
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/callout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, reason, requiredSkill, start, end }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Failed to log call-out");
      return;
    }
    
    // Show success toast
    const selectedStaff = staff.find((s) => s.id.toString() === userId);
    toast.success("Call-out logged successfully", {
      description: `Shift request created for ${selectedStaff?.email || 'staff member'}`,
      duration: 4000,
    });
    
    setOpen(false);
    setUserId("");
    setReason("");
    setRequiredSkill("");
    setStart("");
    setEnd("");
    setShowSuggestions(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="h-11">
          Log New Call-Out
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl font-bold">Log New Call-Out</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Create a new shift request when a staff member calls out.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Staff Selection Section */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="staff" className="text-sm font-medium">Staff Member</Label>
              <p className="text-xs text-muted-foreground mt-1">Select the staff member who called out</p>
            </div>
            <Select value={userId} onValueChange={setUserId} required>
              <SelectTrigger className="h-12 text-left">
                <SelectValue placeholder="Choose a staff member..." />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {staff.map((s) => {
                  const scorePercentage = Math.round(s.reliabilityScore * 100);
                  const colorClasses = getReliabilityColor(s.reliabilityScore);
                  
                  return (
                    <SelectItem key={s.id} value={s.id.toString()} className="py-3">
                      <div className="flex items-center justify-between w-full min-w-0">
                        <span className="truncate">{s.email}</span>
                        <div className={`ml-3 px-2 py-1 rounded-md text-xs font-medium border flex-shrink-0 ${colorClasses}`}>
                          {scorePercentage}%
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Required Skill Section */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="skill" className="text-sm font-medium">Required Skill</Label>
              <p className="text-xs text-muted-foreground mt-1">Specify the skill level needed for this shift</p>
            </div>
            <Input
              id="skill"
              placeholder="e.g. RN, CNA, LPN, Med Tech"
              value={requiredSkill}
              onChange={(e) => setRequiredSkill(e.target.value)}
              required
              className="h-12"
            />
          </div>

          {/* Start Time Section */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="start" className="text-sm font-medium">Start Time</Label>
              <p className="text-xs text-muted-foreground mt-1">When should the replacement shift begin?</p>
            </div>
            <DateTimePicker
              id="start"
              value={start}
              onChange={handleStartTimeChange}
              placeholder="Select start time"
              required
            />
          </div>

          {/* End Time Section */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="end" className="text-sm font-medium">End Time</Label>
              <p className="text-xs text-muted-foreground mt-1">When should the replacement shift end?</p>
            </div>
            <DateTimePicker
              id="end"
              value={end}
              onChange={setEnd}
              placeholder="Select end time"
              required
            />
            {start && !end && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                <span>💡</span>
                <span>End time will auto-fill to 8 hours after start time</span>
              </p>
            )}
          </div>

          {/* Reason Section */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="reason" className="text-sm font-medium">Reason <span className="text-muted-foreground">(optional)</span></Label>
              <p className="text-xs text-muted-foreground mt-1">Add any additional context about the call-out</p>
            </div>
            <Input
              id="reason"
              placeholder="e.g. Sick, Family emergency, Personal matter..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Smart Suggestions Toggle */}
          {requiredSkill && start && end && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Smart Staff Suggestions</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get AI-powered recommendations for the best replacement staff
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="flex items-center gap-2"
                >
                  {showSuggestions ? '🔽' : '▶️'} 
                  {showSuggestions ? 'Hide' : 'Show'} Suggestions
                </Button>
              </div>
              
              <SmartStaffSuggestions
                requiredSkill={requiredSkill}
                shiftStart={start}
                shiftEnd={end}
                excludeStaffId={userId ? parseInt(userId) : undefined}
                onStaffSelect={(staffId, staffEmail) => {
                  // Auto-fill the staff selection if they want to assign immediately
                  toast.info(`Selected ${staffEmail} - you can still modify the call-out details before submitting`);
                }}
                isVisible={showSuggestions}
              />
            </div>
          )}

          {error && (
            <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-destructive">⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-6 border-t border-border/50">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="h-12 px-6 order-2 sm:order-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading} 
                className="h-12 px-6 order-1 sm:order-2"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  "Log Call-Out"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 