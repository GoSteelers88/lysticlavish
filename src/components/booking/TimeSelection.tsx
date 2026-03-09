'use client';

import { useState, useEffect } from 'react';
import { format, addDays, isSameDay, parseISO, startOfDay, nextSaturday, isSaturday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChevronLeft, ChevronRight, Calendar, Clock, Loader2 } from 'lucide-react';

interface TimeSlot {
  startTime: string;
  endTime: string;
  displayTime: string;
  available: boolean;
}

interface TimeSelectionProps {
  serviceId: string;
  selectedDateTime: string | null;
  onSelect: (dateTime: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function TimeSelection({
  serviceId,
  selectedDateTime,
  onSelect,
  onNext,
  onBack,
}: TimeSelectionProps) {
  const getFirstSaturday = () => {
    const today = startOfDay(new Date());
    return isSaturday(today) ? today : nextSaturday(today);
  };

  const [selectedDate, setSelectedDate] = useState<Date>(
    selectedDateTime ? parseISO(selectedDateTime) : getFirstSaturday()
  );
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleDates, setVisibleDates] = useState<Date[]>([]);

  // Generate visible Saturdays (next 8 weeks)
  useEffect(() => {
    const dates: Date[] = [];
    const today = startOfDay(new Date());
    let sat = isSaturday(today) ? today : nextSaturday(today);

    for (let i = 0; i < 8; i++) {
      dates.push(sat);
      sat = addDays(sat, 7);
    }

    setVisibleDates(dates);
  }, []);

  // Fetch available slots when date changes
  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      setError(null);

      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const response = await fetch(
          `/api/availability?serviceId=${serviceId}&date=${dateStr}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch availability');
        }

        const data = await response.json();

        if (data.success) {
          setSlots(data.data.slots);
        } else {
          setError(data.error || 'Failed to load availability');
        }
      } catch (err) {
        console.error('Error fetching slots:', err);
        setError('Unable to load available times. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) {
      fetchSlots();
    }
  }, [selectedDate, serviceId]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Clear selection if changing dates
    if (selectedDateTime && !isSameDay(date, parseISO(selectedDateTime))) {
      onSelect('');
    }
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    if (slot.available) {
      onSelect(slot.startTime);
    }
  };

  const availableSlots = slots.filter((s) => s.available);

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <div>
        <h3 className="font-serif text-lg text-espresso-900 mb-2 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-gold-600" />
          Select a Date
        </h3>
        <p className="text-sm text-espresso-500 mb-4">
          Online booking is available <span className="font-medium text-espresso-700">Saturdays only</span>. For other days, call{' '}
          <a href="tel:+18555532242" className="text-gold-600 hover:text-gold-700">855-553-2242</a>.
        </p>

        {/* Date Carousel */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {visibleDates.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => handleDateSelect(date)}
                className={cn(
                  'flex-shrink-0 w-16 py-3 rounded-xl text-center',
                  'transition-all duration-200',
                  isSelected
                    ? 'bg-espresso-800 text-white shadow-soft'
                    : 'bg-white border border-nude-200 hover:border-gold-400'
                )}
              >
                <span
                  className={cn(
                    'block text-xs uppercase',
                    isSelected ? 'text-champagne-200' : 'text-espresso-500'
                  )}
                >
                  {format(date, 'EEE')}
                </span>
                <span
                  className={cn(
                    'block text-lg font-medium mt-0.5',
                    isSelected ? 'text-white' : 'text-espresso-800'
                  )}
                >
                  {format(date, 'd')}
                </span>
                <span
                  className={cn(
                    'block text-xs',
                    isSelected ? 'text-champagne-200' : 'text-espresso-500'
                  )}
                >
                  {format(date, 'MMM')}
                </span>
                {isToday && (
                  <span
                    className={cn(
                      'block text-2xs mt-1',
                      isSelected ? 'text-gold-300' : 'text-gold-600'
                    )}
                  >
                    Today
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Selection */}
      <div>
        <h3 className="font-serif text-lg text-espresso-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-gold-600" />
          Available Times
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setSelectedDate(new Date(selectedDate))}
            >
              Try Again
            </Button>
          </div>
        ) : availableSlots.length === 0 ? (
          <Card variant="default" padding="md" className="text-center">
            <p className="text-espresso-600">
              No available times on this Saturday. Please select another date or call{' '}
              <a href="tel:+18555532242" className="text-gold-600 hover:text-gold-700 font-medium">855-553-2242</a>.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {slots.map((slot) => {
              const isSelected = selectedDateTime === slot.startTime;

              return (
                <button
                  key={slot.startTime}
                  type="button"
                  onClick={() => handleTimeSelect(slot)}
                  disabled={!slot.available}
                  className={cn(
                    'py-3 px-2 rounded-xl text-sm font-medium',
                    'transition-all duration-200',
                    slot.available
                      ? isSelected
                        ? 'bg-gold-500 text-espresso-900 shadow-soft'
                        : 'bg-white border border-nude-200 text-espresso-700 hover:border-gold-400 hover:bg-gold-50'
                      : 'bg-nude-100 text-nude-400 cursor-not-allowed'
                  )}
                >
                  {slot.displayTime}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Time Summary */}
      {selectedDateTime && (
        <Card variant="luxury" padding="sm" className="mt-4">
          <p className="text-sm text-espresso-600">
            Selected:{' '}
            <span className="font-medium text-espresso-900">
              {format(parseISO(selectedDateTime), 'EEEE, MMMM d, yyyy')} at{' '}
              {format(parseISO(selectedDateTime), 'h:mm a')}
            </span>
          </p>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={onNext}
          disabled={!selectedDateTime}
          className="flex-1"
        >
          Continue
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
