import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/layout/Header';
import { CurrencyCard } from './components/CurrencyCard';
import { Drawer } from './components/ui/Drawer';
import { CurrencyDetailPanel } from './components/CurrencyDetailPanel';
import { OverviewStats } from './components/OverviewStats';
import { useDrawer } from './hooks/useDrawer';
import { useOverview } from './hooks/useCurrencyData';
import { CurrencyCardSkeleton } from './components/ui/Skeleton';
import { ErrorState } from './components/ui/ErrorState';
import { EmptyState } from './components/ui/EmptyState';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { isOpen, selectedCurrency, open, close } = useDrawer();
  const { data: overview, isLoading, isError, refetch } = useOverview();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100">
      <Header overview={overview} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview stats */}
        {overview && <OverviewStats market={overview.market} />}

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <CurrencyCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <ErrorState
            onRetry={refetch}
            className="mt-8"
            description="Valyuta kurslarini yuklashda xatolik yuz berdi. Iltimos, qayta urinib ko'ring."
          />
        )}

        {/* Currencies grid */}
        {overview && overview.currencies.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
            {overview.currencies.map((currency) => (
              <CurrencyCard
                key={currency.code}
                currency={currency}
                onOpen={open}
              />
            ))}
          </div>
        )}

        {/* Empty state when loaded but no currencies */}
        {overview && overview.currencies.length === 0 && (
          <EmptyState
            title="Valyutalar topilmadi"
            description="Hozircha kurs ma'lumotlari mavjud emas. Keyinroq qayta urinib ko'ring."
            className="mt-8"
          />
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-200/80 text-center">
          <p className="text-xs text-slate-400">
            Ma'lumotlar O'zbekiston tijorat banklaridan to'planadi.
            CBU — Markaziy bank rasmiy kursi.
          </p>
        </footer>
      </main>

      {/* Currency Detail Drawer */}
      <Drawer
        isOpen={isOpen}
        onClose={close}
        title={selectedCurrency ? `${selectedCurrency} — Batafsil` : ''}
      >
        {selectedCurrency && (
          <CurrencyDetailPanel currencyCode={selectedCurrency} />
        )}
      </Drawer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
