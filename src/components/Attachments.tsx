import { useState } from 'react';
import { Download, Eye, File as FileIcon, FileText, Image as ImageIcon, Paperclip, Trash2, Upload } from 'lucide-react';
import type { SubmittedFile } from '@/store/types';
import { resizeImage } from './BookCover';

/** Any document a student or teacher is likely to have: Word, PDF, PowerPoint, Excel, text, and photos. */
export const DOCUMENT_ACCEPT = 'image/*,.pdf,.doc,.docx,.odt,.rtf,.txt,.ppt,.pptx,.odp,.xls,.xlsx,.ods,.csv';

/** Files up to this size are kept in full in this browser build. The live system stores every file in cloud storage. */
const MAX_STORED = 1_500_000;

export async function toSubmittedFile(f: File): Promise<SubmittedFile> {
  if (f.type.startsWith('image/')) {
    try { return { name: f.name, size: f.size, type: 'image/jpeg', dataUrl: await resizeImage(f, 1400) }; } catch { /* fall through */ }
  }
  if (f.size <= MAX_STORED) {
    const dataUrl = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f); });
    return { name: f.name, size: f.size, type: f.type || guessType(f.name), dataUrl };
  }
  return { name: f.name, size: f.size, type: f.type || guessType(f.name) };
}

function guessType(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return ({
    pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain', ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', csv: 'text/csv',
  } as Record<string, string>)[ext] ?? 'application/octet-stream';
}

/** Display name without the internal question prefix ("q-123__answer.docx" → "answer.docx"). */
export const displayName = (name: string) => name.replace(/^[^_]+__/, '');
const sizeLabel = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1000))} KB`);
// Never open HTML/SVG inline: an uploaded page could run scripts under the school's site.
const viewable = (type: string) => /^image\/(png|jpe?g|gif|webp)$/.test(type) || type === 'application/pdf' || type === 'text/plain';

function toBlob(f: SubmittedFile): Blob | null {
  if (!f.dataUrl) return null;
  const [head, body] = f.dataUrl.split(',');
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: head.match(/data:([^;]+)/)?.[1] || f.type });
}

/** PDFs, images and text open in a new tab; Word, PowerPoint and Excel files open in the app installed on the device. */
export function openFile(f: SubmittedFile, forceDownload = false) {
  const blob = toBlob(f);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  if (!forceDownload && viewable(blob.type)) a.target = '_blank';
  else a.download = displayName(f.name);
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

const iconFor = (type: string) => (type.startsWith('image/') ? ImageIcon : type.includes('pdf') || type.includes('word') || type.startsWith('text/') ? FileText : FileIcon);

/** A list of files with Open / Download (and optional Remove). */
export function FileList({ files, onRemove, emptyText }: { files: SubmittedFile[]; onRemove?: (index: number) => void; emptyText?: string }) {
  if (!files.length) return emptyText ? <p className="text-sm text-navy-500">{emptyText}</p> : null;
  return (
    <ul className="space-y-2">
      {files.map((f, i) => {
        const Icon = iconFor(f.type);
        return (
          <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-lg border border-navy-100 bg-white px-3 py-2">
            {f.dataUrl && f.type.startsWith('image/') ? <img src={f.dataUrl} alt="" className="w-10 h-10 rounded object-cover" /> : <span className="w-10 h-10 rounded bg-navy-50 flex items-center justify-center"><Icon className="w-5 h-5 text-navy-500" /></span>}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-navy-800 truncate">{displayName(f.name)}</p>
              <p className="text-xs text-navy-500">{sizeLabel(f.size)}{!f.dataUrl && ' · stored in the live system only'}</p>
            </div>
            {f.dataUrl && <button type="button" className="btn-secondary text-xs py-1.5" onClick={() => openFile(f)}><Eye className="w-3.5 h-3.5" /> Open</button>}
            {f.dataUrl && <button type="button" className="p-1.5 rounded hover:bg-navy-50 text-navy-600" aria-label={`Download ${displayName(f.name)}`} onClick={() => openFile(f, true)}><Download className="w-4 h-4" /></button>}
            {onRemove && <button type="button" className="p-1.5 rounded hover:bg-error-50 text-error-600" aria-label={`Remove ${displayName(f.name)}`} onClick={() => onRemove(i)}><Trash2 className="w-4 h-4" /></button>}
          </li>
        );
      })}
    </ul>
  );
}

/** Upload area: documents of any common format, several at once, or a photo from the phone camera. */
export function FileDrop({ onAdd, label = 'Upload files', hint, compact }: { onAdd: (files: SubmittedFile[]) => void; label?: string; hint?: string; compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const take = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    const out: SubmittedFile[] = [];
    for (const f of Array.from(list)) out.push(await toSubmittedFile(f));
    setBusy(false);
    onAdd(out);
  };
  const input = <input type="file" multiple accept={DOCUMENT_ACCEPT} className="sr-only" onChange={(e) => { void take(e.target.files); e.target.value = ''; }} />;
  if (compact) {
    return <label className="btn-secondary text-sm cursor-pointer"><Paperclip className="w-4 h-4" /> {busy ? 'Adding…' : label}{input}</label>;
  }
  return (
    <label
      className={`flex flex-col items-center justify-center gap-1 p-5 border-2 border-dashed rounded-xl cursor-pointer text-center ${over ? 'border-navy-500 bg-navy-50' : 'border-navy-200 hover:bg-navy-50'}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); void take(e.dataTransfer.files); }}
    >
      <Upload className="w-6 h-6 text-navy-500" />
      <span className="text-sm font-medium text-navy-700">{busy ? 'Adding…' : label}</span>
      <span className="text-xs text-navy-500">{hint ?? 'Word, PDF, PowerPoint, Excel, text or photos — drag here or click to choose'}</span>
      {input}
    </label>
  );
}
