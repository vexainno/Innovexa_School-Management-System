import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowRight, BookOpen, CalendarDays, CheckCircle2,
  ClipboardList, Filter, Info, RefreshCw, Search, ShieldAlert, UserRound,
} from 'lucide-react';
import { PageHeader, SectionCard, StatCard, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import {
  getEarlyWarningAlerts, updateEarlyWarningAlert, getEarlyWarningRules,
  saveEarlyWarningRules, resetEarlyWarningDemoData,
  type EarlyWarningAlert, type EarlyWarningCategory, type EarlyWarningRuleSettings,
  type EarlyWarningStatus,
} from '@/data/earlyWarningWorkflow';
import {
  createCounselorCase, upsertStudentRisk, createCounselingIntervention,
} from '@/data/counselorWorkflow';

const categoryLabels: Record<EarlyWarningCategory, string> = {
  attendance: 'Attendance',
  academic: 'Academic performance',
  missing_work: 'Missing assignments',
  teacher_referral: 'Teacher referral',
  student_affairs: 'Student Affairs referral',
};

const statusLabels: Record<EarlyWarningStatus, string> = {
  new: 'New',
  under_review: 'Under review',
  reviewed: 'Reviewed',
  dismissed: 'Dismissed',
};

function severityClass(severity: EarlyWarningAlert['severity']) {
  if (severity === 'high') return 'badge-error';
  if (severity === 'moderate') return 'badge-warning';
  return 'badge-info';
}

function statusClass(status: EarlyWarningStatus) {
  if (status === 'new') return 'badge-error';
  if (status === 'under_review') return 'badge-warning';
  if (status === 'reviewed') return 'badge-success';
  return 'badge-info';
}

function refreshAlerts() {
  return getEarlyWarningAlerts();
}

export function EarlyWarningDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [alerts, setAlerts] = useState<EarlyWarningAlert[]>(refreshAlerts);
  useEffect(() => {
    const refresh = () => setAlerts(refreshAlerts());
    window.addEventListener('innosysedu:early-warning-alerts-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('innosysedu:early-warning-alerts-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const newCount = alerts.filter((item) => item.status === 'new').length;
  const reviewCount = alerts.filter((item) => item.status === 'under_review').length;
  const activeCount = alerts.filter((item) => ['new', 'under_review'].includes(item.status)).length;
  const reviewedCount = alerts.filter((item) => item.status === 'reviewed').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Early-Warning Alerts"
        subtitle="Review attendance, academic and referral patterns that may need student support."
      />
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-900">
          These are simulated indicators for counselor review, not diagnoses or final risk decisions.
          Verify the underlying records and consider context before taking action.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="New Alerts" value={newCount} icon={<AlertTriangle className="w-5 h-5" />} color="error" onClick={() => onNavigate('early-warning')} />
        <StatCard label="Under Review" value={reviewCount} icon={<Activity className="w-5 h-5" />} color="warning" onClick={() => onNavigate('early-warning')} />
        <StatCard label="Students Needing Review" value={activeCount} icon={<UserRound className="w-5 h-5" />} color="navy" onClick={() => onNavigate('early-warning')} />
        <StatCard label="Reviewed" value={reviewedCount} icon={<CheckCircle2 className="w-5 h-5" />} color="success" onClick={() => onNavigate('early-warning')} />
      </div>
      <SectionCard
        title="Latest alerts"
        action={<button className="btn-ghost text-sm" onClick={() => onNavigate('early-warning')}>View all <ArrowRight className="inline w-4 h-4 ml-1" /></button>}
      >
        <div className="space-y-3">
          {alerts.filter((item) => ['new', 'under_review'].includes(item.status)).slice(0, 5).map((alert) => (
            <button key={alert.id} onClick={() => onNavigate('early-warning')} className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-navy-100 hover:bg-navy-50">
              <span className="p-2 rounded-lg bg-amber-50 text-amber-700"><AlertTriangle className="w-4 h-4" /></span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-navy-800">{alert.studentName}</span>
                <span className="block text-xs text-navy-500">{alert.title} · {alert.className}</span>
              </span>
              <span className={severityClass(alert.severity)}>{alert.severity}</span>
            </button>
          ))}
          {activeCount === 0 && <EmptyState icon={<CheckCircle2 className="w-6 h-6" />} title="No alerts awaiting review" message="New indicators will appear here when the demo alert service creates them." />}
        </div>
      </SectionCard>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => onNavigate('early-warning')} className="card-hover p-5 text-left">
          <div className="flex items-center gap-3"><ShieldAlert className="w-5 h-5 text-navy-600" /><h3 className="font-semibold text-navy-800">Review alert evidence</h3></div>
          <p className="text-sm text-navy-500 mt-2">Inspect the source, dates and evidence behind each indicator.</p>
        </button>
        <button onClick={() => onNavigate('early-warning-rules')} className="card-hover p-5 text-left">
          <div className="flex items-center gap-3"><Filter className="w-5 h-5 text-navy-600" /><h3 className="font-semibold text-navy-800">Configure detection rules</h3></div>
          <p className="text-sm text-navy-500 mt-2">Adjust demo thresholds for attendance, lateness, grade trends and missing work.</p>
        </button>
      </div>
    </div>
  );
}

export function EarlyWarningAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<EarlyWarningAlert[]>(getEarlyWarningAlerts());
  const [selectedId, setSelectedId] = useState<string | null>(alerts[0]?.id ?? null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const refresh = () => setAlerts(getEarlyWarningAlerts());
    window.addEventListener('innosysedu:early-warning-alerts-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('innosysedu:early-warning-alerts-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const filtered = useMemo(() => alerts.filter((alert) => {
    const matchesQuery = `${alert.studentName} ${alert.studentId} ${alert.title} ${alert.className}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || alert.category === categoryFilter;
    return matchesQuery && matchesStatus && matchesCategory;
  }), [alerts, query, statusFilter, categoryFilter]);

  const selected = alerts.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  function changeStatus(status: EarlyWarningStatus) {
    if (!selected) return;
    updateEarlyWarningAlert(selected.id, {
      status,
      reviewedBy: user?.id ?? 'demo-counselor',
      reviewedAt: new Date().toISOString(),
    });
    setMessage(`Alert marked ${statusLabels[status].toLowerCase()}.`);
  }

  function handleAction(action: 'case' | 'risk' | 'intervention' | 'dismiss') {
    if (!selected) return;
    try {
      if (action === 'case') {
        createCounselorCase({
          studentId: selected.studentId,
          category: selected.category === 'academic' || selected.category === 'missing_work' ? 'academic' : 'other',
          status: 'open',
          dateOpened: new Date().toISOString().slice(0, 10),
          confidential: true,
          summary: `Created from early-warning alert: ${selected.title}. ${selected.explanation}`,
          createdBy: user?.id ?? 'u7',
        });
        updateEarlyWarningAlert(selected.id, { status: 'reviewed', actionTaken: 'Support case created' });
        setMessage('Support case created from this alert.');
      } else if (action === 'risk') {
        upsertStudentRisk(selected.studentId, selected.severity === 'high' ? 'at_risk' : 'moderate', selected.explanation, user?.id ?? 'u7');
        updateEarlyWarningAlert(selected.id, { status: 'reviewed', actionTaken: 'Added to counselor risk register' });
        setMessage('Student risk register updated. The counselor remains responsible for the assessment.');
      } else if (action === 'intervention') {
        createCounselingIntervention({
          studentId: selected.studentId,
          type: 'Early-warning follow-up',
          description: `Review and follow up on: ${selected.title}. ${selected.explanation}`,
          status: 'ongoing',
          startDate: new Date().toISOString().slice(0, 10),
          counselorId: user?.id ?? 'u7',
        });
        updateEarlyWarningAlert(selected.id, { status: 'reviewed', actionTaken: 'Intervention record created' });
        setMessage('Intervention record created.');
      } else {
        const reason = window.prompt('Why is this alert being dismissed?');
        if (!reason?.trim()) return;
        updateEarlyWarningAlert(selected.id, { status: 'dismissed', reviewNote: reason.trim(), actionTaken: 'Dismissed with reason' });
        setMessage('Alert dismissed with a reason recorded.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The action could not be completed.');
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Early-Warning Alerts" subtitle="Review evidence, record your assessment and decide the appropriate next step." />
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Indicators are prompts for professional review, not diagnoses. Confirm source records and context. Confidential counseling notes are not used as alert evidence.
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <section className="xl:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1"><Search className="absolute left-3 top-3 w-4 h-4 text-navy-400" /><input className="input pl-9" placeholder="Search student or alert..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
            <select className="input sm:max-w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All statuses</option><option value="new">New</option><option value="under_review">Under review</option><option value="reviewed">Reviewed</option><option value="dismissed">Dismissed</option></select>
          </div>
          <select className="input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="all">All categories</option>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <SectionCard title={`Alert queue (${filtered.length})`}>
            <div className="space-y-2">
              {filtered.map((alert) => (
                <button key={alert.id} onClick={() => { setSelectedId(alert.id); setMessage(''); }} className={`w-full rounded-lg border p-3 text-left transition-colors ${selected?.id === alert.id ? 'border-navy-400 bg-navy-50' : 'border-navy-100 hover:bg-navy-50'}`}>
                  <div className="flex items-start gap-2"><span className="flex-1 min-w-0"><span className="block font-semibold text-sm text-navy-800">{alert.studentName}</span><span className="block text-xs text-navy-500 mt-1">{alert.title}</span><span className="block text-xs text-navy-400 mt-1">{categoryLabels[alert.category]} · {alert.detectedAt}</span></span><span className={severityClass(alert.severity)}>{alert.severity}</span></div>
                  <div className="mt-2"><span className={statusClass(alert.status)}>{statusLabels[alert.status]}</span></div>
                </button>
              ))}
              {filtered.length === 0 && <EmptyState icon={<Search className="w-5 h-5" />} title="No matching alerts" message="Try another search term or filter." />}
            </div>
          </SectionCard>
        </section>
        <section className="xl:col-span-3 space-y-4">
          {selected ? (
            <>
              <SectionCard title="Alert review">
                <div className="flex flex-wrap gap-2 mb-3"><span className={severityClass(selected.severity)}>{selected.severity} indicator</span><span className={statusClass(selected.status)}>{statusLabels[selected.status]}</span></div>
                <h2 className="text-lg font-semibold text-navy-900">{selected.title}</h2>
                <p className="text-sm text-navy-500 mt-1">{selected.studentName} · {selected.studentId} · {selected.className}</p>
                <p className="text-sm text-navy-700 mt-4">{selected.explanation}</p>
                <div className="mt-5 space-y-3">
                  <h3 className="font-semibold text-sm text-navy-800">Supporting evidence</h3>
                  {selected.evidence.map((item, index) => (
                    <div key={`${selected.id}-${index}`} className="rounded-lg bg-navy-50 p-3">
                      <div className="flex flex-wrap justify-between gap-2"><span className="text-sm font-medium text-navy-800">{item.label}</span><span className="text-xs text-navy-400">{item.recordedAt}</span></div>
                      <p className="text-sm text-navy-700 mt-1">{item.value}</p>
                      <p className="text-xs text-navy-400 mt-1">Source: {item.source}</p>
                    </div>
                  ))}
                </div>
                {selected.actionTaken && <p className="mt-4 text-sm text-emerald-700">Previous action: {selected.actionTaken}</p>}
                {selected.reviewNote && <p className="mt-2 text-sm text-navy-500">Review note: {selected.reviewNote}</p>}
              </SectionCard>
              <SectionCard title="Counselor actions">
                <p className="text-xs text-navy-400 mb-3">Choose an action after checking the source evidence. Actions update the local demo records only.</p>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-primary" onClick={() => changeStatus('under_review')}>Mark under review</button>
                  <button className="btn-secondary" onClick={() => handleAction('case')}>Create support case</button>
                  <button className="btn-secondary" onClick={() => handleAction('risk')}>Add to risk register</button>
                  <button className="btn-secondary" onClick={() => handleAction('intervention')}>Create intervention</button>
                  <button className="btn-ghost text-rose-700" onClick={() => handleAction('dismiss')}>Dismiss with reason</button>
                  <button className="btn-ghost" onClick={() => changeStatus('reviewed')}>Mark reviewed</button>
                </div>
              </SectionCard>
              {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
            </>
          ) : (
            <EmptyState icon={<AlertTriangle className="w-6 h-6" />} title="Select an alert" message="Choose an alert from the queue to inspect its evidence." />
          )}
        </section>
      </div>
    </div>
  );
}

export function EarlyWarningRules() {
  const [rules, setRules] = useState<EarlyWarningRuleSettings>(getEarlyWarningRules());
  const [saved, setSaved] = useState(false);

  function update<K extends keyof EarlyWarningRuleSettings>(key: K, value: EarlyWarningRuleSettings[K]) {
    setRules((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function save() {
    saveEarlyWarningRules(rules);
    setSaved(true);
  }

  function reset() {
    resetEarlyWarningDemoData();
    setRules(getEarlyWarningRules());
    setSaved(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Early-Warning Rule Settings" subtitle="Configure transparent demonstration thresholds. The real rule engine will be implemented by the backend/data-science workstream later." />
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        These settings do not currently scan live school records or generate alerts automatically. They are saved as frontend demo configuration only.
      </div>
      <SectionCard title="Detection thresholds">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className="label">Absences within review period</label><input className="input" type="number" min="1" max="30" value={rules.attendanceAbsenceThreshold} onChange={(e) => update('attendanceAbsenceThreshold', Math.max(1, Number(e.target.value)))} /><p className="text-xs text-navy-400 mt-1">Example: create a review prompt when absences reach this number.</p></div>
          <div><label className="label">Late arrivals within review period</label><input className="input" type="number" min="1" max="30" value={rules.latenessThreshold} onChange={(e) => update('latenessThreshold', Math.max(1, Number(e.target.value)))} /></div>
          <div><label className="label">Academic decline percentage</label><input className="input" type="number" min="1" max="100" value={rules.gradeDeclinePercentage} onChange={(e) => update('gradeDeclinePercentage', Math.min(100, Math.max(1, Number(e.target.value))))} /><p className="text-xs text-navy-400 mt-1">Compare a defined recent average with an earlier comparison window.</p></div>
          <div><label className="label">Missing assignments</label><input className="input" type="number" min="1" max="30" value={rules.missingWorkThreshold} onChange={(e) => update('missingWorkThreshold', Math.max(1, Number(e.target.value)))} /></div>
        </div>
        <div className="mt-5 space-y-3">
          <label className="flex items-center gap-2 text-sm text-navy-700"><input type="checkbox" checked={rules.includeTeacherReferrals} onChange={(e) => update('includeTeacherReferrals', e.target.checked)} /> Include teacher referrals in counselor review queue</label>
          <label className="flex items-center gap-2 text-sm text-navy-700"><input type="checkbox" checked={rules.includeStudentAffairsReferrals} onChange={(e) => update('includeStudentAffairsReferrals', e.target.checked)} /> Include Student Affairs referrals in counselor review queue</label>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button className="btn-primary" onClick={save}>Save rule settings</button>
          <button className="btn-secondary" onClick={reset}><RefreshCw className="inline w-4 h-4 mr-1" /> Reset demo data</button>
          {saved && <span role="status" className="text-sm text-emerald-700">Settings saved in this browser.</span>}
        </div>
      </SectionCard>
      <SectionCard title="Rule design safeguards">
        <ul className="list-disc pl-5 space-y-2 text-sm text-navy-600">
          <li>One absence, one low mark or one referral must not automatically determine a student's risk level.</li>
          <li>Rules should be configurable by the school and evaluated over a defined period.</li>
          <li>Every alert must show its source evidence and reason in understandable language.</li>
          <li>Only the Counselor makes the final support/risk assessment.</li>
          <li>Confidential counseling notes and sensitive personal traits are excluded from routine alert detection.</li>
        </ul>
      </SectionCard>
    </div>
  );
}
