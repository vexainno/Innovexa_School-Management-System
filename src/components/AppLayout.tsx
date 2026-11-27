import { useState, type ReactNode } from 'react';
import {
  Activity, AlertCircle, AlertTriangle, Archive, ArrowLeftRight, Award, BarChart3, Bell, BellRing, BookCopy, BookMarked,
  BookOpen, BookPlus, BookX, Building2, Calculator, CalendarCheck, CalendarClock, CalendarDays, CalendarRange, ChevronDown,
  ClipboardCheck, ClipboardEdit, ClipboardList, Clock, CloudCog, CreditCard, Database, FileBadge, FileBarChart, FileCheck,
  FileHeart, FilePlus2, FileQuestion, FileSpreadsheet, FileText, FolderArchive, Gauge, Gavel, GraduationCap, HardDrive,
  HeartHandshake, History, IdCard, Inbox, KeyRound, LayoutDashboard, Layers, Library, LifeBuoy, ListChecks, LogOut, Megaphone,
  Menu, MessageSquare, MessagesSquare, Navigation, NotebookPen, PiggyBank, Plug, Receipt, ReceiptText, RefreshCw, Repeat2,
  School, ScrollText, Send, Settings, Shield, ShieldAlert, SlidersHorizontal, Tags, TrendingUp, Upload, UserCheck, UserCog,
  UserMinus, UserPlus, UserRoundCheck, Users, Users2, Wallet, Wrench, X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_NAV, ROLE_TITLES } from '@/config/navigation';
import { Avatar } from '@/components/ui';
import { resetDemoData } from '@/services/demoDataService';
import { actions, fmtDate, notificationsFor, resetSchoolData, useSchool } from '@/store/store';
import type { Role } from '@/types';

const ICONS: Record<string, typeof LayoutDashboard> = {
  Activity, AlertCircle, AlertTriangle, Archive, ArrowLeftRight, Award, BarChart3, Bell, BellRing, BookCopy, BookMarked,
  BookOpen, BookPlus, BookX, Building2, Calculator, CalendarCheck, CalendarClock, CalendarDays, CalendarRange, ClipboardCheck,
  ClipboardEdit, ClipboardList, Clock, CloudCog, CreditCard, Database, FileBadge, FileBarChart, FileCheck, FileHeart, FilePlus2,
  FileQuestion, FileSpreadsheet, FileText, FolderArchive, Gauge, Gavel, GraduationCap, HardDrive, HeartHandshake, History, IdCard,
  Inbox, KeyRound, LayoutDashboard, Layers, Library, LifeBuoy, ListChecks, Megaphone, MessageSquare, MessagesSquare, Navigation,
  NotebookPen, PiggyBank, Plug, Receipt, ReceiptText, RefreshCw, Repeat2, School, ScrollText, Send, Settings, Shield, ShieldAlert,
  SlidersHorizontal, Tags, TrendingUp, Upload, UserCheck, UserCog, UserMinus, UserPlus, UserRoundCheck, Users, Users2, Wallet, Wrench,
};

export function AppLayout({ currentPage, onNavigate, children }: { currentPage: string; onNavigate: (page: string) => void; children: ReactNode }) {
  const { user, logout, switchDemoAccount } = useAuth();
  const school = useSchool();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  if (!user) return null;

  const navItems = ROLE_NAV[user.role] || [];
  const roleTitle = ROLE_TITLES[user.role];
  const notes = notificationsFor(school, user);
  const unread = notes.filter((n) => !n.readBy.includes(user.id));
  const base = currentPage.split(':')[0];
  const go = (page: string) => { onNavigate(page); setSidebarOpen(false); };
  const isPlatform = user.role === 'super_admin';

  let lastGroup: string | undefined;

  return (
    <div className="min-h-screen bg-navy-50 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-navy-950/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-navy-900 text-white z-40 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} aria-label="Main navigation">
        <div className="px-5 py-5 border-b border-navy-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0"><School className="w-6 h-6 text-navy-800" /></div>
            <div>
              <p className="font-display font-bold text-lg leading-tight">InnosysEdu</p>
              <p className="text-xs text-navy-300">{isPlatform ? 'Innovexa Platform' : school.school.name}</p>
            </div>
          </div>
          <button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-navy-800" aria-label="Close menu"><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = ICONS[item.icon] || LayoutDashboard;
            const active = base === item.page;
            const header = item.group && item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <div key={item.page}>
                {header && <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-navy-400">{header}</p>}
                <button type="button" onClick={() => go(item.page)} aria-current={active ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-navy-700 text-white shadow-sm' : 'text-navy-300 hover:bg-navy-800 hover:text-white'}`}>
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <span className="text-left">{item.label}</span>
                </button>
              </div>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-navy-800">
          <button type="button" onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-navy-300 hover:bg-error-600 hover:text-white transition-colors">
            <LogOut className="w-[18px] h-[18px]" /><span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-navy-100 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-navy-100 text-navy-700" aria-label="Open menu"><Menu className="w-5 h-5" /></button>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy-800 truncate">{isPlatform ? 'Innovexa Platform Workspace' : school.school.name}</p>
              <p className="text-xs text-navy-400 truncate">{isPlatform ? 'School deployments and infrastructure' : `${school.school.academicYear} Academic Year${school.school.currentPeriod ? ` · ${school.school.currentPeriod}` : ''}`}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="relative">
              <button type="button" onClick={() => { setBellOpen(!bellOpen); setUserMenuOpen(false); }} className="relative p-2 rounded-lg hover:bg-navy-50 text-navy-600" aria-label={`Notifications (${unread.length} unread)`}>
                <Bell className="w-5 h-5" />
                {unread.length > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error-600 text-white text-[10px] font-bold flex items-center justify-center">{unread.length > 9 ? '9+' : unread.length}</span>}
              </button>
              {bellOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setBellOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-[22rem] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-navy-100 z-40 animate-slide-up">
                    <div className="px-4 py-3 border-b border-navy-100 flex justify-between items-center">
                      <p className="text-sm font-semibold text-navy-900">Notifications</p>
                      {unread.length > 0 && <button type="button" className="text-xs text-navy-600 hover:underline" onClick={() => actions.markAllRead(unread.map((n) => n.id), user.id)}>Mark all read</button>}
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-navy-50">
                      {notes.length === 0 && <p className="text-sm text-navy-500 p-4">No notifications yet.</p>}
                      {notes.slice(0, 8).map((n) => (
                        <button key={n.id} type="button" onClick={() => { actions.markRead(n.id, user.id); setBellOpen(false); if (n.link) go(n.link); }} className="w-full text-left px-4 py-3 hover:bg-navy-50">
                          <p className={`text-sm ${n.readBy.includes(user.id) ? 'text-navy-600' : 'font-semibold text-navy-900'}`}>{n.title}</p>
                          <p className="text-xs text-navy-500 line-clamp-2">{n.body}</p>
                          <p className="text-[11px] text-navy-400 mt-0.5">{fmtDate(n.createdAt)}</p>
                        </button>
                      ))}
                    </div>
                    {<button type="button" className="w-full text-center text-sm font-medium text-navy-700 py-2.5 border-t border-navy-100 hover:bg-navy-50" onClick={() => { setBellOpen(false); go('notifications'); }}>View all</button>}
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button type="button" onClick={() => { setUserMenuOpen(!userMenuOpen); setBellOpen(false); }} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-navy-50" aria-label="Account menu">
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
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400 mb-2">Developer: switch workspace</p>
                        <select aria-label="Switch workspace" value={user.role} onChange={(e) => { switchDemoAccount(e.target.value as Role); setUserMenuOpen(false); }} className="input text-xs py-2">
                          {Object.entries(ROLE_TITLES).map(([role, title]) => <option key={role} value={role}>{title}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="p-2">
                      {import.meta.env.DEV && (
                        <button type="button" onClick={() => { if (window.confirm('Reset all demo school data in this browser?')) { resetDemoData(); resetSchoolData(); window.location.reload(); } }} className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm text-navy-600 hover:bg-navy-50"><RefreshCw className="w-4 h-4" /> Reset demo data</button>
                      )}
                      <button type="button" onClick={() => { logout(); setUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-error-600 hover:bg-error-50"><LogOut className="w-4 h-4" /> Sign Out</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

export type { Role };
