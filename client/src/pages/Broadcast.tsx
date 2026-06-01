import { useState } from 'react';
import { Send, Image as ImageIcon, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface BroadcastResult {
  total: number;
  sent: number;
  failed: number;
}

export default function BroadcastPage() {
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSend = (text.trim().length > 0 || imageUrl.trim().length > 0) && !sending;

  const handleSend = async () => {
    setError(null);
    setResult(null);

    if (!canSend) {
      return;
    }

    const confirmed = window.confirm(
      "Xabar barcha faol foydalanuvchilarga yuboriladi. Davom etasizmi?"
    );
    if (!confirmed) {
      return;
    }

    setSending(true);
    try {
      const { data } = await api.post('/admin/broadcast', {
        text: text.trim(),
        imageUrl: imageUrl.trim() || undefined,
      });
      setResult(data.data as BroadcastResult);
      setText('');
      setImageUrl('');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.errors?._ ||
        "Xabar yuborishda xatolik yuz berdi.";
      setError(message);
    }
    setSending(false);
  };

  return (
    <div className="animate-slide-up space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-100">Xabar yuborish</h1>
        <p className="mt-0.5 text-sm text-slate-400">
          Barcha faol Telegram foydalanuvchilariga matn va/yoki rasm yuboring.
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
              rows={7}
              maxLength={4000}
              placeholder="Foydalanuvchilarga yubormoqchi bo'lgan xabaringiz..."
              className="input w-full resize-y text-sm"
            />
            <p className="mt-1 text-right text-xs text-slate-500">{text.length}/4000</p>
            <p className="mt-1 text-xs text-slate-500">
              HTML qo'llab-quvvatlanadi: &lt;b&gt;qalin&lt;/b&gt;, &lt;i&gt;kursiv&lt;/i&gt;
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Rasm URL (ixtiyoriy)
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
            <p className="mt-1 text-xs text-slate-500">
              Rasm berilsa, matn rasm tagidagi izoh (caption) sifatida yuboriladi.
            </p>
          </div>

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
            {imageUrl.trim() ? (
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
