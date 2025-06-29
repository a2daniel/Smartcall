"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id?: number; email?: string; role?: string } | null>(null);
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Try to get user info from session cookie
    const match = document.cookie.match(/session=([^;]+)/);
    if (match) {
      try {
        const session = JSON.parse(decodeURIComponent(match[1]));
        setUser(session);
      } catch {
        setUser(null);
      }
    }

    // Check for dark mode preference
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDark(darkMode);
    document.documentElement.classList.toggle('dark', darkMode);
  }, []);



  function toggleDarkMode() {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.documentElement.classList.toggle('dark', newDarkMode);
  }

  const navLinks = user?.role === "MANAGER" 
    ? [{ href: "/manager/dashboard", label: "Dashboard", icon: "📊" }]
    : [{ href: "/staff/shifts", label: "Shifts", icon: "🕐" }];

  const sidebarVariants = {
    hidden: { x: -280, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { 
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.div 
        className="w-64 bg-sidebar shadow-lg flex flex-col border-r border-sidebar-border"
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
      >
        {/* App Header */}
        <motion.div variants={itemVariants} className="p-6 border-b border-sidebar-border">
          <h1 className="text-2xl font-bold text-sidebar-foreground">SmartCall</h1>
          <p className="text-sm text-muted-foreground mt-1">Shift Management</p>
        </motion.div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <motion.ul variants={itemVariants} className="space-y-2">
            {navLinks.map((link) => (
              <motion.li key={link.href} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    pathname === link.href
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span className="font-medium">{link.label}</span>
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        </nav>

        {/* Dark Mode Toggle */}
        <motion.div variants={itemVariants} className="p-4 border-t border-sidebar-border">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDarkMode}
            className="w-full mb-4 h-9"
          >
            {isDark ? "🌞" : "🌙"} {isDark ? "Light" : "Dark"} Mode
          </Button>
        </motion.div>

        {/* User Info & Logout */}
        <motion.div variants={itemVariants} className="p-4 border-t border-sidebar-border">
          {user ? (
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center ring-2 ring-primary/20">
                  <span className="text-primary font-semibold text-sm">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 text-sm text-muted-foreground italic">Loading user...</div>
          )}
        </motion.div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <motion.main 
          className="flex-1 p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
} 