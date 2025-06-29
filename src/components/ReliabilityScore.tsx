"use client";
import React from "react";
import { motion } from "framer-motion";
import { getReliabilityColor, getReliabilityLabel, formatResponseTime, ReliabilityStats } from "@/lib/reliability";

interface ReliabilityScoreProps {
  stats: ReliabilityStats;
  compact?: boolean;
}

export default function ReliabilityScore({ stats, compact = false }: ReliabilityScoreProps) {
  const scorePercentage = Math.round(stats.score * 100);
  const colorClasses = getReliabilityColor(stats.score);
  const label = getReliabilityLabel(stats.score);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-medium text-foreground">Reliability Score</div>
          <div className="text-xs text-muted-foreground">
            {stats.totalShifts} shift{stats.totalShifts !== 1 ? 's' : ''}
            {stats.avgResponseTimeMinutes > 0 && (
              <> • {formatResponseTime(stats.avgResponseTimeMinutes)} avg</>
            )}
          </div>
        </div>
        <div className={`px-3 py-2 rounded-lg text-sm font-medium border ${colorClasses}`}>
          {scorePercentage}%
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-xl shadow-sm p-6 border"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Your Reliability Score</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${colorClasses}`}>
          {label}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <div className={`text-3xl font-bold ${scorePercentage >= 80 ? 'text-emerald-600' : scorePercentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
            {scorePercentage}%
          </div>
          <p className="text-muted-foreground text-sm">
            Based on {stats.totalShifts} shift{stats.totalShifts !== 1 ? 's' : ''}
            {stats.avgResponseTimeMinutes > 0 && (
              <> • Avg response: {formatResponseTime(stats.avgResponseTimeMinutes)}</>
            )}
          </p>
        </div>

        {/* Progress Ring */}
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-muted/20"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - stats.score)}`}
              className={scorePercentage >= 80 ? 'text-emerald-500' : scorePercentage >= 60 ? 'text-yellow-500' : 'text-red-500'}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xs font-bold ${scorePercentage >= 80 ? 'text-emerald-600' : scorePercentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {scorePercentage}%
            </span>
          </div>
        </div>
      </div>

      {stats.totalShifts > 0 && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-lg font-semibold text-emerald-600">
              {stats.completedShifts}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">
              {stats.missedShifts}
            </div>
            <div className="text-xs text-muted-foreground">Missed</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-primary">
              {Math.round(stats.completionRate * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Success Rate</div>
          </div>
        </div>
      )}

      {stats.totalShifts === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">No shift history available</p>
          <p className="text-xs">Your score will update as you accept shifts</p>
        </div>
      )}
    </motion.div>
  );
} 