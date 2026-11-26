import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard, Users, Users2, CalendarCheck, GraduationCap, ClipboardCheck,
  Award, FileBarChart, Megaphone, Activity, BellRing, Gavel, CalendarX, ListChecks,
  UserPlus, FileText, Grid3x3, ArrowLeftRight, FolderOpen, FileCheck, ClipboardList,
  CheckCircle2, Send, BookOpen, Library, ClipboardEdit, MessageSquare, HeartHandshake,
  AlertTriangle, FileHeart, Receipt, CreditCard, AlertCircle, ReceiptText, BarChart3,
  BookPlus, Inbox, BookMarked, History, Shield, KeyRound, Building2, Plug, ScrollText,
  Menu, LogOut, ChevronDown, School, X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_NAV, ROLE_TITLES } from '@/config/navigation';
import { SCHOOL_INFO } from '@/data/mockData';
import { Avatar } from '@/components/ui';
import { resetDemoData } from '@/services/demoDataService';
import type { Role } from '@/types';

const ICONS: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard, Users, Users2, CalendarCheck, GraduationCap, ClipboardCheck,
  Award, FileBarChart, Megaphone, Activity, BellRing, Gavel, CalendarX, ListChecks,
  UserPlus, FileText, Grid3x3, ArrowLeftRight, FolderOpen, FileCheck, ClipboardList,
  CheckCircle2, Send, BookOpen, Library, ClipboardEdit, MessageSquare, HeartHandshake,
  AlertTriangle, FileHeart, Receipt, CreditCard, AlertCircle, ReceiptText, BarChart3,
  BookPlus, Inbox, BookMarked, History, Shield, KeyRound, Building2, Plug, ScrollText,
};

export function AppLayout({
  currentPage, onNavigate, children,
}: {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: ReactNode;
}) {
  const { user, logout, switchDemoAccount } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  if (!user) return null;

  const navItems = ROLE_NAV[user.role] || [];
  const roleTitle = ROLE_TITLES[user.role];

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-navy-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-navy-950/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-64 bg-navy-900 text-white z-40
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand */}
        <div className="px-5 py-5 border-b border-navy-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
              <School className="w-6 h-6 text-navy-800" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-tight">InnosysEdu</h1>
              <p className="text-xs text-navy-300">Innovexa TechHub</p>
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-5 py-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-navy-800 rounded-lg">
            <Avatar name={user.name} color={user.avatarColor} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-navy-300 truncate">{roleTitle}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = ICONS[item.icon] || LayoutDashboard;
            const active = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => handleNavigate(item.page)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${active
                    ? 'bg-navy-700 text-white shadow-sm'
                    : 'text-navy-300 hover:bg-navy-800 hover:text-white'}
                `}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-navy-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-navy-300 hover:bg-error-600 hover:text-white transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 sm:px-6 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex flex-wrap items-center justify-between gap-2" role="status">
          <span><strong>DEMO MODE</strong> · Sample data and browser-local actions only. No real messages, payments or account changes are processed.</span>
          <span className="font-medium">Preview environment</span>
        </div>
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white border-b border-navy-100 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-navy-100 text-navy-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-sm text-navy-400">{user.role === 'super_admin' ? 'Innovexa Platform Workspace' : SCHOOL_INFO.schoolName}</p>
              <p className="text-xs text-navy-300">
                {user.role === 'super_admin' ? 'Cross-school platform operations' : `${SCHOOL_INFO.academicYear} · ${SCHOOL_INFO.currentTerm}`}
              </p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-navy-50 transition-colors"
            >
              <Avatar name={user.name} color={user.avatarColor} size="sm" />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-navy-800">{user.name}</p>
                <p className="text-xs text-navy-400">{roleTitle}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-navy-400" />
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-navy-100 z-40 animate-slide-up">
                  <div className="px-4 py-3 border-b border-navy-100">
                    <p className="text-sm font-medium text-navy-800">{user.name}</p>
                    <p className="text-xs text-navy-400">{user.email}</p>
                  </div>
                  {import.meta.env.DEV && (
                    <div className="px-3 py-3 border-b border-navy-100">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400 mb-2">Demo workspace switcher</p>
                      <select
                        aria-label="Switch demo role"
                        value={user.role}
                        onChange={(event) => { switchDemoAccount(event.target.value as Role); setUserMenuOpen(false); }}
                        className="input text-xs py-2"
                      >
                        {Object.entries(ROLE_TITLES).map(([role, title]) => (
                          <option key={role} value={role}>{title}</option>
                        ))}
                      </select>
                      <p className="text-[11px] text-navy-400 mt-2">Switches to a seeded preview identity. This is not production authorization.</p>
                    </div>
                  )}
                  <div className="p-2">
                    {import.meta.env.DEV && (
                      <button
                        onClick={() => {
                          if (window.confirm("Reset this browser's InnosysEdu demo records? This cannot be undone.")) {
                            resetDemoData();
                            window.location.reload();
                          }
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-navy-600 hover:bg-navy-50"
                      >Reset demo data</button>
                    )}
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-error-600 hover:bg-error-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile close button */}
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed top-4 right-4 z-50 lg:hidden p-2 rounded-lg bg-navy-800 text-white"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export type { Role };
