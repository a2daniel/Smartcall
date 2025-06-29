"use client";
import React from "react";
import CallOutLogList from "./CallOutLogList";
import ManagerCalendar from "./ManagerCalendar";
import ManagerHeader from "./ManagerHeader";

export default function ManagerDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:60px_60px]" />
      
      {/* Header */}
      <ManagerHeader />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column: Call-Outs */}
          <div className="xl:col-span-2">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-premium-lg border-premium">
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground tracking-tight">Recent Call-Outs</h2>
                    <p className="text-muted-foreground text-sm">Track and manage shift replacements</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <CallOutLogList />
              </div>
            </div>
          </div>

          {/* Right Column: Calendar */}
          <div className="xl:col-span-1">
            <div className="sticky top-32">
              <ManagerCalendar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 