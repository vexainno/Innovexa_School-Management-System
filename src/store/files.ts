import type { Gradebook, SchoolState } from './types';
import { className, staffName, studentById, uploadedFiles } from './store';

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  // Neutralise spreadsheet formula injection and quote when needed
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function downloadCsv(fileName: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const body = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  downloadBlob(new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' }), fileName.endsWith('.csv') ? fileName : `${fileName}.csv`);
}

/** Builds the original-looking teacher workbook for a seeded gradebook (real .xlsx file). */
export async function gradebookWorkbook(s: SchoolState, g: Gradebook): Promise<Blob> {
  const uploaded = uploadedFiles.get(g.id);
  if (uploaded) return uploaded;
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const head = (value: string) => ({ value, fontWeight: 'bold' as const, backgroundColor: '#DAE4F4' });
  const rows = [
    [{ value: `${s.school.name} — Gradebook`, fontWeight: 'bold' as const }],
    [{ value: `${className(g.grade, g.section)} · ${g.subject} · ${s.school.academicYear}` }],
    [{ value: `Teacher: ${staffName(s, g.teacherId)}` }],
    [],
    [head('Student ID'), head('Student name'), head('Classwork'), head('Quizzes'), head('Midterm'), head('Final exam'), head('Subject total')],
    ...Object.entries(g.marks).map(([sid, m]) => {
      const st = studentById(s, sid);
      const num = (v: number | null) => (v == null ? { value: '' } : { value: v, type: Number });
      return [{ value: st?.studentNo ?? sid }, { value: st?.name ?? 'Unknown' }, num(m.classwork), num(m.quizzes), num(m.midterm), num(m.final), num(m.total)];
    }),
  ];
  return writeXlsxFile(rows as never, { columns: [{ width: 16 }, { width: 28 }, { width: 11 }, { width: 11 }, { width: 11 }, { width: 11 }, { width: 13 }] } as never).toBlob();
}

export async function downloadGradebook(s: SchoolState, g: Gradebook) {
  const blob = await gradebookWorkbook(s, g);
  downloadBlob(blob, g.fileName);
}

/** Opens a print window with the given HTML (user can print or "Save as PDF"). */
export function printHtml(title: string, bodyHtml: string) {
  const w = window.open('', '_blank', 'width=900,height=1000');
  if (!w) return false;
  w.document.write(`<!doctype html><html><head><title>${title}</title><meta charset="utf-8"><style>
    body{font-family:Inter,Arial,sans-serif;color:#0f1d3d;margin:32px}
    h1{font-size:20px;margin:0}h2{font-size:15px;margin:16px 0 8px}
    table{border-collapse:collapse;width:100%;font-size:12px;margin-top:8px}
    th,td{border:1px solid #b8cce9;padding:6px 8px;text-align:left}th{background:#f0f4fa}
    .muted{color:#5d80c4;font-size:12px}.right{text-align:right}
    .box{border:2px solid #1a2d54;padding:20px;border-radius:6px}
    @media print{button{display:none}}
  </style></head><body>${bodyHtml}<p><button onclick="window.print()">Print / Save as PDF</button></p></body></html>`);
  w.document.close();
  w.focus();
  return true;
}

export const esc = (s: string | number | null | undefined) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

export function tableHtml(header: string[], rows: (string | number | null | undefined)[][]) {
  return `<table><thead><tr>${header.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
}
