'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function DatePicker({
  value,
  onChange,
  className = '',
  placeholder = 'Pick a date',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse YYYY-MM-DD to Date
  const parseDate = (str: string): Date => {
    if (!str) return new Date();
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const selectedDate = value ? parseDate(value) : null;
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate || new Date());

  // Close calendar popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date for display in trigger: "dd/mm/yyyy"
  const formatDateDisplay = (date: Date | null): string => {
    if (!date) return '';
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Generate days in month
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay(); // Weekday of 1st day (0-6)
  const totalDays = new Date(year, month + 1, 0).getDate(); // Total days in this month
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Days array to render
  const days: Array<{ day: number; isCurrentMonth: boolean; dateString: string }> = [];

  // Previous month padding days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthTotalDays - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateString = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ day: d, isCurrentMonth: false, dateString });
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ day: d, isCurrentMonth: true, dateString });
  }

  // Next month padding days to complete grid
  const remainingCells = 42 - days.length; // standard 6-row grid
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateString = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ day: d, isCurrentMonth: false, dateString });
  }

  const handleSelectDay = (dateString: string) => {
    onChange(dateString);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 p-3 rounded-2xl border border-border bg-bg-subtle/50 text-text-primary text-xs font-semibold focus:outline-none focus:border-accent focus:bg-bg-surface focus:ring-4 focus:ring-accent/15 transition-all text-left cursor-pointer ${className}`}
      >
        <CalendarIcon size={16} className="text-text-secondary shrink-0" />
        <span className="flex-1 truncate">
          {selectedDate ? formatDateDisplay(selectedDate) : <span className="text-text-muted font-light">{placeholder}</span>}
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 p-4 rounded-2xl border border-border bg-bg-surface shadow-2xl z-[9999] w-[280px] animate-scaleIn select-none backdrop-blur-md">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-border hover:bg-bg-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <h4 className="text-xs font-bold text-text-primary">
              {monthNames[month]} {year}
            </h4>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-border hover:bg-bg-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {daysOfWeek.map((day) => (
              <span key={day} className="text-[10px] font-bold text-text-muted py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((item, index) => {
              const isSelected = value === item.dateString;
              const isToday = new Date().toISOString().substring(0, 10) === item.dateString;

              return (
                <button
                  key={`${item.dateString}-${index}`}
                  type="button"
                  onClick={() => handleSelectDay(item.dateString)}
                  className={`h-8 w-8 rounded-lg text-[11px] flex items-center justify-center transition-all cursor-pointer ${
                    !item.isCurrentMonth
                      ? 'text-text-muted opacity-40 hover:bg-bg-subtle'
                      : isSelected
                      ? 'bg-accent text-accent-fg font-extrabold shadow-sm'
                      : isToday
                      ? 'bg-bg-subtle text-accent border border-accent/30 font-bold'
                      : 'text-text-primary font-light hover:bg-bg-subtle'
                  }`}
                >
                  {item.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
