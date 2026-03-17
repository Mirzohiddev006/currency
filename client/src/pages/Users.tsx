import { useEffect, useState } from 'react';
import { CheckCircle, RefreshCw, Search, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../lib/api';

interface UserRow {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  subscribedAt: string;
  _count?: { requests: number };
}

interface Meta {
  total: number;
  pages: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadUsers = async (nextPage = 1) => {
    setLoading(true);

    try {
      const { data } = await api.get(`/admin/users?page=${nextPage}&limit=20`);
      setUsers(data.data);
      setMeta(data.meta);
    } catch {
      setUsers([]);
      setMeta(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadUsers(page);
  }, [page]);

  const filtered = users.filter((user) => {
    if (!search) {
      return true;
    }

    const query = search.toLowerCase();
    return (
      user.username?.toLowerCase().includes(query) ||
      user.firstName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="animate-slide-up space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">Foydalanuvchilar</h1>
          {meta && <p className="mt-0.5 text-sm text-slate-400">Jami: {meta.total} ta foydalanuvchi</p>}
        </div>
        <button onClick={() => loadUsers(page)} className="btn-secondary">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input py-2 pl-9 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-800 text-left text-slate-500">
                <th className="pb-3 pr-4">#</th>
                <th className="pb-3 pr-4">Foydalanuvchi</th>
                <th className="pb-3 pr-4">Username</th>
                <th className="pb-3 pr-4">Holat</th>
                <th className="pb-3 pr-4">So'rovlar</th>
                <th className="pb-3">Qo'shilgan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    <RefreshCw className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : (
                filtered.map((user, index) => (
                  <tr key={user.id} className="transition-colors hover:bg-surface-800/40">
                    <td className="py-3 pr-4 font-mono text-xs text-slate-500">
                      {(page - 1) * 20 + index + 1}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary-600/20 bg-primary-600/20 text-sm font-semibold text-primary-400">
                          {(user.firstName || user.username || '?')[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-200">
                          {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Nomsiz'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-mono text-xs text-slate-400">
                        {user.username ? `@${user.username}` : '-'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {user.isActive ? (
                        <span className="badge-success flex w-fit items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Faol
                        </span>
                      ) : (
                        <span className="badge-error flex w-fit items-center gap-1">
                          <XCircle className="h-3 w-3" /> Nofaol
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-mono text-slate-300">
                      {user._count?.requests || 0}
                    </td>
                    <td className="py-3 text-xs text-slate-500">
                      {formatDistanceToNow(new Date(user.subscribedAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.pages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-surface-800 pt-4">
            <p className="text-sm text-slate-400">
              {(page - 1) * 20 + 1}-{Math.min(page * 20, meta.total)} / {meta.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
              >
                &lt; Oldingi
              </button>
              <button
                onClick={() => setPage((current) => Math.min(meta.pages, current + 1))}
                disabled={page === meta.pages}
                className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
              >
                Keyingi &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
