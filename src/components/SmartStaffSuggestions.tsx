"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getScoreColor, getScoreLabel, getConflictIndicator } from '@/lib/shiftConflicts';

interface StaffMatchScore {
  staff: {
    id: number;
    email: string;
    role: string;
    reliabilityScore: number;
    active: boolean;
  };
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

interface SmartSuggestion {
  recommendedStaff: StaffMatchScore[];
  conflictWarnings: string[];
  totalAvailableStaff: number;
  bestMatch?: StaffMatchScore;
}

interface SmartStaffSuggestionsProps {
  requiredSkill: string;
  shiftStart: string;
  shiftEnd: string;
  excludeStaffId?: number;
  onStaffSelect?: (staffId: number, staffEmail: string) => void;
  isVisible: boolean;
}

export default function SmartStaffSuggestions({
  requiredSkill,
  shiftStart,
  shiftEnd,
  excludeStaffId,
  onStaffSelect,
  isVisible
}: SmartStaffSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible && requiredSkill && shiftStart && shiftEnd) {
      fetchSuggestions();
    }
  }, [isVisible, requiredSkill, shiftStart, shiftEnd, excludeStaffId]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/staff/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requiredSkill,
          shiftStart,
          shiftEnd,
          excludeStaffId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
      } else {
        setError('Failed to load staff suggestions');
      }
    } catch (error) {
      console.error('Error fetching staff suggestions:', error);
      setError('Failed to load staff suggestions');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-4"
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Smart Staff Suggestions</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSuggestions}
              disabled={loading}
            >
              {loading ? '🔄' : '🔍'} {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                    <div className="h-6 bg-muted rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {suggestions && !loading && (
            <>
              {/* Conflict Warnings */}
              {suggestions.conflictWarnings.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Scheduling Conflicts Detected</p>
                      <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                        {suggestions.conflictWarnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">📊</span>
                  <p className="text-sm text-blue-800">
                    <strong>{suggestions.totalAvailableStaff}</strong> staff member(s) available without conflicts
                    {suggestions.bestMatch && (
                      <span className="ml-2">
                        • Best match: <strong>{suggestions.bestMatch.staff.email}</strong> ({suggestions.bestMatch.score}% score)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Staff List */}
              <div className="space-y-3">
                {suggestions.recommendedStaff.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">👥</div>
                    <p className="text-muted-foreground">No staff members found</p>
                  </div>
                ) : (
                  suggestions.recommendedStaff.map((staffMatch, index) => {
                    const conflictInfo = getConflictIndicator(staffMatch.hasConflict);
                    const scoreColor = getScoreColor(staffMatch.score);
                    const scoreLabel = getScoreLabel(staffMatch.score);

                    return (
                      <motion.div
                        key={staffMatch.staff.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                          staffMatch.hasConflict 
                            ? 'bg-red-50 border-red-200' 
                            : staffMatch.score >= 80
                            ? 'bg-green-50 border-green-200'
                            : staffMatch.score >= 60
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center ring-2 ring-primary/20">
                                <span className="text-primary font-semibold text-sm">
                                  {staffMatch.staff.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{staffMatch.staff.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${scoreColor}`}>
                                    {scoreLabel} ({staffMatch.score}%)
                                  </span>
                                  <span className={`inline-flex items-center gap-1 text-xs ${conflictInfo.color}`}>
                                    {conflictInfo.icon} {conflictInfo.label}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Reliability Score */}
                            <div className="mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Reliability:</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      staffMatch.reliabilityScore >= 0.8 ? 'bg-green-500' :
                                      staffMatch.reliabilityScore >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${staffMatch.reliabilityScore * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(staffMatch.reliabilityScore * 100)}%
                                </span>
                              </div>
                            </div>

                            {/* Reasons */}
                            <div className="mb-3">
                              <p className="text-xs text-muted-foreground mb-1">Match factors:</p>
                              <div className="flex flex-wrap gap-1">
                                {staffMatch.reasons.map((reason, reasonIndex) => (
                                  <span
                                    key={reasonIndex}
                                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-muted text-muted-foreground"
                                  >
                                    {reason}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Conflicts */}
                            {staffMatch.conflictingShifts.length > 0 && (
                              <div className="mb-3 p-2 bg-red-100 rounded border border-red-200">
                                <p className="text-xs font-medium text-red-800 mb-1">
                                  Scheduling Conflicts ({staffMatch.conflictingShifts.length}):
                                </p>
                                <div className="space-y-1">
                                  {staffMatch.conflictingShifts.map((conflict, conflictIndex) => (
                                    <div key={conflictIndex} className="text-xs text-red-700">
                                      {conflict.requiredSkill} shift: {new Date(conflict.start).toLocaleDateString()} {new Date(conflict.start).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - {new Date(conflict.end).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          {onStaffSelect && (
                            <Button
                              size="sm"
                              variant={staffMatch.hasConflict ? "outline" : "default"}
                              onClick={() => onStaffSelect(staffMatch.staff.id, staffMatch.staff.email)}
                              className="ml-4"
                            >
                              {staffMatch.hasConflict ? 'Select Anyway' : 'Select'}
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
} 