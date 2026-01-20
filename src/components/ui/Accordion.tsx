'use client';

import { useState, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

// Context for accordion state
interface AccordionContextValue {
  openItems: Set<string>;
  toggleItem: (value: string) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordion() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion');
  }
  return context;
}

// Accordion Root
export interface AccordionProps {
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  className?: string;
  children: React.ReactNode;
}

export function Accordion({
  type = 'single',
  defaultValue,
  className,
  children,
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(() => {
    if (!defaultValue) return new Set();
    return new Set(Array.isArray(defaultValue) ? defaultValue : [defaultValue]);
  });

  const toggleItem = (value: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        if (type === 'single') {
          next.clear();
        }
        next.add(value);
      }
      return next;
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div className={cn('space-y-3', className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

// Accordion Item
export interface AccordionItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

const AccordionItemContext = createContext<string | null>(null);

export function AccordionItem({ value, className, children }: AccordionItemProps) {
  return (
    <AccordionItemContext.Provider value={value}>
      <div
        className={cn(
          'bg-white rounded-2xl border border-nude-200/50',
          'overflow-hidden transition-all duration-300',
          className
        )}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

// Accordion Trigger
export interface AccordionTriggerProps {
  className?: string;
  children: React.ReactNode;
}

export function AccordionTrigger({ className, children }: AccordionTriggerProps) {
  const { openItems, toggleItem } = useAccordion();
  const value = useContext(AccordionItemContext);

  if (!value) {
    throw new Error('AccordionTrigger must be used within an AccordionItem');
  }

  const isOpen = openItems.has(value);

  return (
    <button
      type="button"
      onClick={() => toggleItem(value)}
      className={cn(
        'w-full flex items-center justify-between p-5',
        'font-sans text-left text-espresso-800 font-medium',
        'hover:bg-nude-50 transition-colors duration-200',
        className
      )}
      aria-expanded={isOpen}
    >
      {children}
      <ChevronDown
        className={cn(
          'w-5 h-5 text-espresso-500 transition-transform duration-300',
          isOpen && 'rotate-180'
        )}
      />
    </button>
  );
}

// Accordion Content
export interface AccordionContentProps {
  className?: string;
  children: React.ReactNode;
}

export function AccordionContent({ className, children }: AccordionContentProps) {
  const { openItems } = useAccordion();
  const value = useContext(AccordionItemContext);

  if (!value) {
    throw new Error('AccordionContent must be used within an AccordionItem');
  }

  const isOpen = openItems.has(value);

  return (
    <div
      className={cn(
        'grid transition-all duration-300 ease-luxury',
        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      )}
    >
      <div className="overflow-hidden">
        <div className={cn('px-5 pb-5 text-espresso-600', className)}>
          {children}
        </div>
      </div>
    </div>
  );
}
