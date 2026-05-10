import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_ABBR = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function daysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(month: number, year: number) {
  return new Date(year, month, 1).getDay();
}

function fmtDate(day: number, month: number, year: number) {
  return `${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
}

interface CalendarGridProps {
  currentMonth: number;
  currentYear: number;
  selectedDate: Date | null;
  onSelect: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

function CalendarGrid({ currentMonth, currentYear, selectedDate, onSelect, onPrevMonth, onNextMonth }: CalendarGridProps) {
  const total = daysInMonth(currentMonth, currentYear);
  const firstDay = firstDayOfMonth(currentMonth, currentYear);
  const prevTotal = daysInMonth(currentMonth - 1, currentYear);
  const cells: { day: number; type: 'prev' | 'curr' | 'next' }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevTotal - i, type: 'prev' });
  }
  for (let d = 1; d <= total; d++) {
    cells.push({ day: d, type: 'curr' });
  }
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, type: 'next' });
  }

  const today = new Date();

  return (
    <>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_ABBR.map((d, i) => (
          <div key={i} className="text-center text-xs font-semibold text-content-tertiary p-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (cell.type !== 'curr') {
            return (
              <button
                key={i}
                onClick={() => {
                  if (cell.type === 'prev') { onPrevMonth(); onSelect(cell.day); }
                  else                     { onNextMonth(); onSelect(cell.day); }
                }}
                className="p-2 text-sm rounded text-content-disabled hover:bg-action-secondary transition-colors"
              >
                {cell.day}
              </button>
            );
          }

          const date = new Date(currentYear, currentMonth, cell.day);
          const isToday    = date.toDateString() === today.toDateString();
          const isSelected = selectedDate?.toDateString() === date.toDateString();

          return (
            <button
              key={i}
              onClick={() => onSelect(cell.day)}
              className={cn(
                'p-2 text-sm rounded transition-colors',
                isSelected
                  ? 'bg-action-primary text-content-on-action'
                  : isToday
                    ? 'border border-action-primary text-content-primary hover:bg-action-secondary'
                    : 'text-content-primary hover:bg-action-secondary',
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </>
  );
}

interface DatePickerProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  size?: 'normal' | 'small' | 'xsmall';
  showCalendar?: boolean;
  className?: string;
}

const triggerSize = {
  normal: 'text-sm p-3',
  small:  'text-xs p-2',
  xsmall: 'text-xs p-1.5',
} as const;

export function DatePicker({
  label = 'Date picker label',
  value = '',
  onChange,
  size = 'normal',
  showCalendar = false,
  className = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen]           = useState(showCalendar);
  const [selectedDate, setSelected]   = useState<Date | null>(null);
  const [currentMonth, setMonth]      = useState(new Date().getMonth());
  const [currentYear, setYear]        = useState(new Date().getFullYear());

  const prevMonth = () => { if (currentMonth === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (currentMonth === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const handleSelect = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    setSelected(date);
    onChange?.(fmtDate(day, currentMonth, currentYear));
  };

  const handleToday = () => {
    const t = new Date();
    setMonth(t.getMonth()); setYear(t.getFullYear()); setSelected(t);
    onChange?.(fmtDate(t.getDate(), t.getMonth(), t.getFullYear()));
  };

  return (
    <div className={cn('inline-block', className)}>
      {label && (
        <label className="block text-sm font-medium text-content-secondary mb-2">{label}</label>
      )}

      <div className="relative">
        <input
          type="text"
          value={value}
          placeholder="MM/DD/YYYY"
          onChange={(e) => onChange?.(e.target.value)}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'border-2 border-stroke-default rounded w-full pr-10 text-content-primary bg-surface-raised',
            'focus:border-action-primary focus:outline-none focus:ring-1 focus:ring-action-primary',
            triggerSize[size],
          )}
        />
        <CalendarIcon
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      {isOpen && (
        <div className="mt-2 bg-surface-overlay border border-stroke-default rounded-lg shadow-lg p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <select
                value={currentMonth}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="border border-stroke-default rounded px-3 py-1.5 text-sm bg-hv-neutral-900 text-hv-neutral-0 focus:border-action-primary focus:outline-none"
              >
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select
                value={currentYear}
                onChange={(e) => setYear(Number(e.target.value))}
                className="border border-stroke-default rounded px-3 py-1.5 text-sm bg-hv-neutral-900 text-hv-neutral-0 focus:border-action-primary focus:outline-none"
              >
                {Array.from({ length: 100 }, (_, i) => currentYear - 50 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <CalendarGrid
            currentMonth={currentMonth}
            currentYear={currentYear}
            selectedDate={selectedDate}
            onSelect={handleSelect}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
          />

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-stroke-subtle">
            <button onClick={prevMonth} className="p-1 hover:bg-action-secondary rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-content-secondary" />
            </button>
            <button onClick={handleToday} className="text-sm text-action-primary hover:text-action-primary-hover font-medium transition-colors">
              Today
            </button>
            <button onClick={nextMonth} className="p-1 hover:bg-action-secondary rounded-full transition-colors">
              <ChevronRight className="w-5 h-5 text-content-secondary" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface DatePickerCalendarProps {
  selectedDate?: Date | null;
  onDateSelect?: (date: Date) => void;
  size?: 'normal' | 'small';
  className?: string;
}

export function DatePickerCalendar({
  selectedDate = null,
  onDateSelect,
  size = 'normal',
  className = '',
}: DatePickerCalendarProps) {
  const [currentMonth, setMonth] = useState(new Date().getMonth());
  const [currentYear, setYear]   = useState(new Date().getFullYear());

  const prevMonth = () => { if (currentMonth === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (currentMonth === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const handleSelect = (day: number) => onDateSelect?.(new Date(currentYear, currentMonth, day));

  const handleToday = () => {
    const t = new Date();
    setMonth(t.getMonth()); setYear(t.getFullYear()); onDateSelect?.(t);
  };

  const calSize = size === 'small' ? 'w-72' : 'w-80';

  return (
    <div className={cn('bg-surface-overlay border border-stroke-default rounded-lg p-4', calSize, className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button className="flex items-center gap-1 border border-stroke-default rounded px-3 py-1.5 text-sm bg-hv-neutral-900 text-hv-neutral-0 hover:bg-hv-neutral-700 transition-colors">
            {MONTHS[currentMonth]}
          </button>
          <button className="flex items-center gap-1 border border-stroke-default rounded px-3 py-1.5 text-sm bg-hv-neutral-900 text-hv-neutral-0 hover:bg-hv-neutral-700 transition-colors">
            {currentYear}
          </button>
        </div>
      </div>

      <CalendarGrid
        currentMonth={currentMonth}
        currentYear={currentYear}
        selectedDate={selectedDate}
        onSelect={handleSelect}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
      />

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-stroke-subtle">
        <button onClick={prevMonth} className="p-1 hover:bg-action-secondary rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-content-secondary" />
        </button>
        <button onClick={handleToday} className="text-sm text-action-primary hover:text-action-primary-hover font-medium transition-colors">
          Today
        </button>
        <button onClick={nextMonth} className="p-1 hover:bg-action-secondary rounded-full transition-colors">
          <ChevronRight className="w-5 h-5 text-content-secondary" />
        </button>
      </div>
    </div>
  );
}

export function DatePickerDay({
  day,
  state = 'default',
  isCurrentDate = false,
}: {
  day: number;
  state?: 'default' | 'hover' | 'pressed' | 'selected' | 'highlight' | 'disabled' | 'focused';
  isCurrentDate?: boolean;
}) {
  const stateClass = {
    default:   'text-content-primary hover:bg-action-secondary',
    hover:     'bg-action-secondary text-content-primary',
    pressed:   'bg-action-primary-active text-content-on-action',
    selected:  'bg-action-primary text-content-on-action',
    highlight: 'bg-action-primary text-content-on-action',
    disabled:  'bg-surface-sunken text-content-disabled cursor-not-allowed',
    focused:   'ring-2 ring-action-primary text-content-primary',
  } as const;

  return (
    <button
      className={cn(
        'w-10 h-10 flex items-center justify-center rounded text-sm font-medium transition-colors',
        isCurrentDate && 'border-2 border-action-primary',
        stateClass[state],
      )}
    >
      {day}
    </button>
  );
}
