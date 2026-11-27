import { useState } from 'react';
import { Download, FileText, Upload } from 'lucide-react';
import { actions, fmtDate, useSchool } from '@/store/store';
import { downloadBlob } from '@/store/files';
import { clearTemplateFile, fillTemplate, inspectTemplate, loadTemplateFile, PLACEHOLDERS, saveTemplateFile, starterTemplate, templateData } from '@/store/docxTemplate';
import { Card, Notice, Pill, Table } from '@/components/kit';

/** Academic Officer: upload the school's own Word report-card design; the platform fills it for each student. */
export function SchoolTemplateUpload() {
  const s = useSchool();
  const meta = s.reportTemplateFile;
  const [tags, setTags] = useState<string[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const upload = async (f: File | null) => {
    if (!f) return;
    setError(''); setTags(null);
    if (!/\.docx$/i.test(f.name)) { setError('Upload a Word document saved as .docx.'); return; }
    if (f.size > 3_000_000) { setError('The template is larger than 3 MB. Compress images in Word (File → Compress Pictures) and try again.'); return; }
    setBusy(true);
    const buf = await f.arrayBuffer();
    const r = await inspectTemplate(buf);
    setBusy(false);
    if (!r.ok) { setError(r.error ?? 'Invalid template.'); return; }
    try { saveTemplateFile(buf); } catch { setError('This browser could not store the template (storage full).'); return; }
    actions.setReportTemplateFile({ name: f.name, size: f.size, uploadedAt: new Date().toISOString(), active: true });
    setTags(r.tags);
  };
  const testFill = async () => {
    const buf = loadTemplateFile();
    if (!buf) return;
    try {
      const id = s.students.find((x) => x.status === 'active')?.id;
      if (!id) { setError('Register at least one student to test the template.'); return; }
      downloadBlob(await fillTemplate(buf, templateData(s, id)), 'Template_test.docx');
    } catch (e) { setError(`The template could not be filled: ${(e as Error).message}`); }
  };
  const unknown = tags?.filter((t) => !PLACEHOLDERS.some(([p]) => p.includes(t.replace(/[#/]/g, '').replace(/[{}]/g, ''))) && !/_total\}$/.test(t) && !['{subject}', '{teacher}', '{classwork}', '{quizzes}', '{midterm}', '{final}', '{total}', '{letter}'].includes(t)) ?? [];
  return (
    <Card title="Use the school's own report card design (Word)" subtitle="Design the report card in Microsoft Word exactly as the school wants it — logo, layout, fonts — and type placeholders where the platform should write each student's details.">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <ol className="text-sm text-navy-700 list-decimal pl-5 space-y-1">
            <li>Download the starter template (or open your existing report card in Word).</li>
            <li>Keep your design and type the placeholders from the list, e.g. <code className="bg-navy-50 px-1 rounded">{'{student_name}'}</code>.</li>
            <li>Save as <b>.docx</b> and upload it here.</li>
            <li>Every report card is then produced in your design, one file per student.</li>
          </ol>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary text-sm" onClick={async () => downloadBlob(await starterTemplate(), 'Report_card_starter_template.docx')}><Download className="w-4 h-4" /> Download starter template</button>
            <label className="btn-primary text-sm cursor-pointer"><Upload className="w-4 h-4" /> {busy ? 'Checking…' : 'Upload school template (.docx)'}<input type="file" accept=".docx" className="sr-only" onChange={(e) => upload(e.target.files?.[0] ?? null)} /></label>
          </div>
          {error && <Notice tone="error">{error}</Notice>}
          {meta && (
            <div className="rounded-xl border border-navy-100 p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-8 h-8 text-navy-600" />
                <div className="flex-1">
                  <p className="font-medium text-navy-900">{meta.name}</p>
                  <p className="text-xs text-navy-500">{Math.round(meta.size / 1024)} KB · uploaded {fmtDate(meta.uploadedAt)}</p>
                  <div className="mt-2">{meta.active ? <Pill tone="success">In use for report cards</Pill> : <Pill tone="muted">Not in use</Pill>}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button type="button" className="btn-secondary text-xs" onClick={testFill}>Test with a student</button>
                <button type="button" className="btn-secondary text-xs" onClick={() => actions.setReportTemplateFile({ ...meta, active: !meta.active })}>{meta.active ? 'Stop using it' : 'Use this template'}</button>
                <button type="button" className="btn-ghost text-xs text-error-600" onClick={() => { clearTemplateFile(); actions.setReportTemplateFile(undefined); setTags(null); }}>Remove</button>
              </div>
            </div>
          )}
          {tags && (
            <Notice tone={unknown.length ? 'warning' : 'success'}>
              Template accepted. Placeholders found: {tags.join(' ') || 'none'}.
              {unknown.length > 0 && <> Not recognised (will be left blank): {unknown.join(' ')}.</>}
            </Notice>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-navy-900 mb-2">Placeholders you can use</h3>
          <Table head={['Placeholder', 'Filled with']}>
            {PLACEHOLDERS.map(([p, d]) => <tr key={p}><td className="font-mono text-xs whitespace-nowrap">{p}</td><td className="text-xs">{d}</td></tr>)}
          </Table>
        </div>
      </div>
    </Card>
  );
}
