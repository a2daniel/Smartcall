"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function StaffShiftsList({ shifts, user }: { shifts: any[]; user: any }) {
  const router = useRouter();
  
  async function acceptShift(shiftId: number) {
    await fetch("/api/shift/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shiftId }),
    });
    router.refresh();
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const emptyStateVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };
  
  return (
    <motion.div 
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {shifts.length === 0 ? (
          <motion.div 
            className="text-center py-16"
            variants={emptyStateVariants}
            initial="hidden"
            animate="visible"
            key="empty"
          >
            <motion.div 
              className="text-6xl mb-4 text-muted-foreground/50"
              animate={{ 
                rotate: [0, 10, -10, 0],
                y: [0, -10, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse" as const
              }}
            >
              🕐
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-muted-foreground font-medium text-lg mb-2">
                No open shifts available
              </p>
              <p className="text-muted-foreground/70 text-sm">
                Check back later for new opportunities
              </p>
            </motion.div>
          </motion.div>
        ) : (
          shifts.map((shift, index) => (
            <motion.div
              key={shift.id}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.02, 
                y: -4,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
              className="p-4 sm:p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <motion.span 
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      {shift.requiredSkill}
                    </motion.span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(shift.start).toLocaleDateString()} • {new Date(shift.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(shift.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Requested by:</span>{" "}
                    {shift.callOutLogs[0]?.user?.email || <span className="italic text-muted-foreground">Unknown</span>}
                  </p>
                </div>
                
                {user?.role === "STAFF" && !shift.assignedToId && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.4 }}
                  >
                    <Button
                      onClick={() => acceptShift(shift.id)}
                      className="w-full sm:w-auto h-11"
                      size="lg"
                    >
                      Accept Shift
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </motion.div>
  );
} 