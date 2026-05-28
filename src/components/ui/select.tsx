'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[] | string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select option',
  className = '',
  dropdownClassName = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to Option[]
  const normalizedOptions: Option[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2.5 rounded-xl border border-border bg-bg-subtle text-text-primary text-xs font-semibold focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 transition-all text-left cursor-pointer ${className}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          size={16}
          className={`text-text-secondary shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-accent' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className={`absolute left-0 right-0 mt-1.5 rounded-xl border border-border bg-bg-surface shadow-xl z-[999] py-1 max-h-60 overflow-y-auto animate-fadeIn backdrop-blur-md ${dropdownClassName}`}>
          {normalizedOptions.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left cursor-pointer hover:bg-bg-subtle transition-colors ${
                  isSelected ? 'bg-accent/10 text-[#cda005] dark:text-[#feb904] font-bold' : 'text-text-primary font-light'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check size={14} className="text-accent shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
