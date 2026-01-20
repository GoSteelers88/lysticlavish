'use client';

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  className?: string;
  contentClassName?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  className,
  contentClassName,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  children,
}: ModalProps) {
  // Handle escape key
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'animate-fade-in'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-espresso-900/60 backdrop-blur-sm"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className={cn(
          'relative w-full max-w-lg max-h-[90vh] overflow-y-auto',
          'bg-white rounded-3xl shadow-soft-xl',
          'animate-scale-in',
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="sticky top-0 bg-white rounded-t-3xl border-b border-nude-100 px-6 py-4 flex items-center justify-between z-10">
            {title && (
              <div>
                <h2
                  id="modal-title"
                  className="font-serif text-xl text-espresso-900"
                >
                  {title}
                </h2>
                {description && (
                  <p
                    id="modal-description"
                    className="text-sm text-espresso-600 mt-1"
                  >
                    {description}
                  </p>
                )}
              </div>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'p-2 rounded-xl text-espresso-500',
                  'hover:bg-nude-100 hover:text-espresso-700',
                  'transition-colors duration-200',
                  !title && 'absolute top-4 right-4'
                )}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={cn('p-6', contentClassName)}>{children}</div>
      </div>
    </div>
  );

  // Use portal to render modal at document root
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
}

// Sheet variant (slides in from side)
export interface SheetProps extends Omit<ModalProps, 'className'> {
  side?: 'left' | 'right';
}

export function Sheet({
  isOpen,
  onClose,
  side = 'right',
  children,
  ...props
}: SheetProps) {
  const slideAnimation = side === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={cn(
        'fixed inset-y-0 max-w-md h-full max-h-full rounded-none',
        side === 'right' ? 'right-0 rounded-l-3xl' : 'left-0 rounded-r-3xl',
        slideAnimation
      )}
      {...props}
    >
      {children}
    </Modal>
  );
}
