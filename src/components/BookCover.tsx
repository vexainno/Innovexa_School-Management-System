import type { Book } from '@/store/types';

const PALETTE = ['#1a2d54', '#7c2d12', '#14532d', '#4c1d95', '#7f1d1d', '#0c4a6e', '#713f12', '#134e4a'];
const hue = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length;

/** Uploaded cover photo, or a clean generated cover when the library hasn't added one yet. */
export function BookCover({ book, className = 'w-full aspect-[3/4]' }: { book: Book; className?: string }) {
  if (book.cover) return <img src={book.cover} alt={`Cover of ${book.title}`} className={`${className} object-cover rounded-md shadow-sm bg-navy-100`} />;
  const bg = PALETTE[hue(book.category + book.title)];
  return (
    <div className={`${className} rounded-md shadow-sm flex flex-col justify-between p-3 text-white overflow-hidden`} style={{ background: `linear-gradient(160deg, ${bg}, ${bg}cc)` }} role="img" aria-label={`Cover of ${book.title}`}>
      <span className="text-[10px] uppercase tracking-widest opacity-80">{book.category}</span>
      <span className="font-display font-bold leading-tight text-sm line-clamp-4">{book.title}</span>
      <span className="text-[11px] opacity-90 line-clamp-2">{book.author}</span>
    </div>
  );
}

/** Shrinks a chosen photo to a small JPEG so it can be stored with the catalogue. */
export function resizeImage(file: File, max = 360): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Not an image')); };
    img.src = url;
  });
}
