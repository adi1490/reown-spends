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

  const parseDate = (str: string): Date => {
    if (!str) return new Date();
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const selectedDate = value ? parseDate(value) : null;
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate || new Date());

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Display dd/mm/yyyy
  const formatDateDisplay = (date: Date | null): string => {
    if (!date) return '';
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const handlePrevMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const handleNextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const days: Array<{ day: number; isCurrentMonth: boolean; dateString: string }> = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthTotalDays - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    days.push({
      day: d,
      isCurrentMonth: false,
      dateString: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
  }

  for (let d = 1; d <= totalDays; d++) {
    days.push({
      day: d,
      isCurrentMonth: true,
      dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
  }

  const remainingCells = 42 - days.length;
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    days.push({
      day: d,
      isCurrentMonth: false,
      dateString: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
  }

  const handleSelectDay = (dateString: string) => {
    onChange(dateString);
    setIsOpen(false);
  };

  const todayString = new Date().toISOString().substring(0, 10);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger button — clicking anywhere opens picker */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2.5 text-left cursor-pointer ${className}`}
        style={{
          padding: '9px 13px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--bg-surface)',
          color: selectedDate ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize: '13px',
          fontFamily: selectedDate ? 'var(--font-mono)' : 'var(--font-sans)',
          fontWeight: selectedDate ? 500 : 300,
          outline: 'none',
          transition: 'border-color 0.15s ease',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <CalendarIcon size={14} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedDate ? formatDateDisplay(selectedDate) : placeholder}
        </span>
      </button>

      {isOpen && (
        <div
          className="animate-scaleIn"
          style={{
            position: 'absolute',
            left: 0,
            top: 'calc(100% + 6px)',
            zIndex: 9999,
            width: '272px',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-surface)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.10)',
            userSelect: 'none',
          }}
        >
          {/* Month header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                padding: '6px',
                borderRadius: '7px',
                border: '1px solid var(--border)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <ChevronLeft size={14} />
            </button>

            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {monthNames[month]} {year}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                padding: '6px',
                borderRadius: '7px',
                border: '1px solid var(--border)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
            {daysOfWeek.map((day) => (
              <span
                key={day}
                style={{
                  textAlign: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  padding: '4px 0',
                  letterSpacing: '0.04em',
                }}
              >
                {day}
              </span>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {days.map((item, index) => {
              const isSelected = value === item.dateString;
              const isToday = todayString === item.dateString;

              return (
                <button
                  key={`${item.dateString}-${index}`}
                  type="button"
                  onClick={() => handleSelectDay(item.dateString)}
                  style={{
                    height: '32px',
                    width: '100%',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: isToday && !isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                    backgroundColor: isSelected
                      ? 'var(--accent)'
                      : isToday
                      ? 'var(--bg-subtle)'
                      : 'transparent',
                    color: isSelected
                      ? 'var(--accent-fg)'
                      : !item.isCurrentMonth
                      ? 'var(--text-muted)'
                      : isToday
                      ? 'var(--accent)'
                      : 'var(--text-primary)',
                    fontWeight: isSelected ? 700 : isToday ? 600 : item.isCurrentMonth ? 400 : 300,
                    opacity: !item.isCurrentMonth ? 0.4 : 1,
                    transition: 'background-color 0.1s ease',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-container)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = isToday ? 'var(--bg-subtle)' : 'transparent';
                    }
                  }}
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
