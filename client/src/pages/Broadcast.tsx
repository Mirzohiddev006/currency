import { useRef, useState } from 'react';
import {
  Send,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Upload,
  FileText,
  X,
} from 'lucide-react';
import { api } from '../lib/api';

interface BroadcastResult {
  total: number;
  sent: number;
  failed: number;
}

interface PickedFile {
  name: string;
  type: string;
  size: number;
  base64: string;
  dataUrl: string;
}

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function BroadcastPage() {
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImageFile = file?.type.startsWith('image/') ?? false;
  const canSend =
    (text.trim().length > 0 || imageUrl.trim().length > 0 || !!file) && !sending;

  const pickFile = (f: File | null) => {
    setError(null);
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      setError('Fayl hajmi 15MB dan oshmasligi kerak.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      setFile({ name: f.name, type: f.type, size: f.size, base64, dataUrl });
      // Fayl tanlansa URL maydonini tozalaymiz (bittasi yetarli).
      setImageUrl('');
    };
    reader.readAsDataURL(f);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    setError(null);
    setResult(null);
    if (!canSend) return;

    const confirmed = window.confirm(
      'Xabar barcha faol foydalanuvchilarga yuboriladi. Davom etasizmi?'
    );
    if (!confirmed) return;

    setSending(true);
    try {
      const payload: Record<string, string> = { text: text.trim() };
      if (file) {
        payload.fileBase64 = file.base64;
        payload.fileName = file.name;
        payload.mimeType = file.type || 'application/octet-stream';
      } else if (imageUrl.trim()) {
        payload.imageUrl = imageUrl.trim();
      }

      const { data } = await api.post('/admin/broadcast', payload);
      setResult(data.data as BroadcastResult);
      setText('');
      setImageUrl('');
      clearFile();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.errors?._ ||
        'Xabar yuborishda xatolik yuz berdi.';
      setError(message);
    }
    setSending(false);
  };

  return (
    <div className="animate-slide-up space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-100">Xabar yuborish</h1>
        <p className="mt-0.5 text-sm text-slate-400">
          Barcha faol Telegram foydalanuvchilariga matn, rasm yoki fayl yuboring.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="card space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Xabar matni</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              maxLength={4000}
              placeholder="Foydalanuvchilarga yubormoqchi bo'lgan xabaringiz..."
              className="input w-full resize-y text-sm"
            />
            <p className="mt-1 text-right text-xs text-slate-500">{text.length}/4000</p>
            <p className="mt-1 text-xs text-slate-500">
              HTML qo'llab-quvvatlanadi: &lt;b&gt;qalin&lt;/b&gt;, &lt;i&gt;kursiv&lt;/i&gt;
            </p>
          </div>

          {/* Fayl tanlash */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Rasm yoki fayl (ixtiyoriy)
            </label>

            {!file ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-surface-700 bg-surface-900/40 px-4 py-6 text-slate-400 transition-colors hover:border-amber-500/40 hover:text-slate-200"
              >
                <Upload className="h-6 w-6" />
                <span className="text-sm">Fayl tanlash uchun bosing</span>
                <span className="text-xs text-slate-500">Rasm yoki hujjat · maksimal 15MB</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-surface-700 bg-surface-900/60 p-3">
                {isImageFile ? (
                  <img
                    src={file.dataUrl}
                    alt="tanlangan"
                    className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-300">
                    <FileText className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">{file.name}</p>
                  <p className="text-xs text-slate-500">{humanSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  title="O'chirish"
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 transition-colors hover:bg-rose-500/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* URL (faqat fayl tanlanmaganda) */}
          {!file && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                yoki rasm URL
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/rasm.jpg"
                  className="input w-full py-2 pl-9 text-sm"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={!canSend}
            className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-40"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Yuborilmoqda...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Hammaga yuborish
              </>
            )}
          </button>

          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Yuborildi: <b>{result.sent}</b> / {result.total} ta.
                {result.failed > 0 && <> Muvaffaqiyatsiz: {result.failed} ta.</>}
              </span>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="card space-y-3 p-6">
          <p className="text-sm font-medium text-slate-300">Ko'rinishi (preview)</p>
          <div className="rounded-2xl border border-surface-800 bg-surface-900/60 p-4">
            {file && isImageFile ? (
              <img
                src={file.dataUrl}
                alt="preview"
                className="mb-3 max-h-64 w-full rounded-xl object-cover"
              />
            ) : file ? (
              <div className="mb-3 flex items-center gap-2 rounded-xl bg-surface-800/60 p-3 text-sm text-slate-300">
                <FileText className="h-5 w-5 text-sky-300" />
                <span className="truncate">{file.name}</span>
              </div>
            ) : imageUrl.trim() ? (
              <img
                src={imageUrl.trim()}
                alt="preview"
                className="mb-3 max-h-64 w-full rounded-xl object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
            {text.trim() ? (
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{text}</p>
            ) : (
              <p className="text-sm text-slate-500">Bu yerda xabar ko'rinishi chiqadi...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
