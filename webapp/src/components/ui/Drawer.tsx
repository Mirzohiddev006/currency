import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Panel - slides from right on desktop, from bottom on mobile */}
      <div
        className={cn(
          'fixed z-50 bg-white shadow-2xl transition-transform duration-300 ease-in-out',
          // Mobile: bottom sheet
          'bottom-0 left-0 right-0 rounded-t-2xl max-h-[90vh]',
          // Desktop: right side panel (full height)
          'md:top-0 md:right-0 md:left-auto md:bottom-0 md:w-[480px] md:max-h-full md:rounded-none md:rounded-l-2xl',
          isOpen
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-y-0 md:translate-x-full'
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-white flex-shrink-0">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors duration-200"
            aria-label="Yopish"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto drawer-scroll h-[calc(100%-65px)] pb-8">
          {children}
        </div>
      </div>
    </>
  );
}
