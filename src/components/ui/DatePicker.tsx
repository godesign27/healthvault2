import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface DatePickerProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  size?: 'normal' | 'small' | 'xsmall';
  showCalendar?: boolean;
  className?: string;
}

export function DatePicker({
  label = 'Date picker label',
  value = '',
  onChange,
  size = 'normal',
  showCalendar = false,
  className = ''
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(showCalendar);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const sizeClasses = {
    normal: 'text-sm p-3',
    small: 'text-xs p-2',
    xsmall: 'text-xs p-1.5'
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    setSelectedDate(date);
    const formattedDate = `${String(currentMonth + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}/${currentYear}`;
    onChange?.(formattedDate);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
    const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
    onChange?.(formattedDate);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    const prevMonthDays = getDaysInMonth(currentMonth - 1, currentYear);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(
        <button
          key={`prev-${i}`}
          className="text-gray-400 hover:bg-gray-100 rounded p-2 text-sm"
          onClick={() => {
            handlePrevMonth();
            handleDateSelect(prevMonthDays - i);
          }}
        >
          {prevMonthDays - i}
        </button>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate?.toDateString() === date.toDateString();

      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          className={`
            p-2 text-sm rounded transition-colors
            ${isToday ? 'border border-indigo-600' : ''}
            ${isSelected ? 'bg-stone-900 text-white' : 'hover:bg-gray-100'}
          `}
        >
          {day}
        </button>
      );
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(
        <button
          key={`next-${i}`}
          className="text-gray-400 hover:bg-gray-100 rounded p-2 text-sm"
          onClick={() => {
            handleNextMonth();
            handleDateSelect(i);
          }}
        >
          {i}
        </button>
      );
    }

    return days;
  };

  return (
    <div className={`inline-block ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={value}
          placeholder="MM/DD/YYYY"
          onChange={(e) => onChange?.(e.target.value)}
          onClick={() => setIsOpen(!isOpen)}
          className={`
            border-2 border-gray-300 rounded w-full pr-10
            focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100
            ${sizeClasses[size]}
          `}
        />
        <CalendarIcon
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      {isOpen && (
        <div className="mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(Number(e.target.value))}
                className="border-2 border-gray-300 rounded px-3 py-1.5 text-sm bg-[#1C2938] text-white focus:border-indigo-600 focus:outline-none"
              >
                {months.map((month, idx) => (
                  <option key={month} value={idx}>
                    {month}
                  </option>
                ))}
              </select>

              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                className="border-2 border-gray-300 rounded px-3 py-1.5 text-sm bg-[#1C2938] text-white focus:border-indigo-600 focus:outline-none"
              >
                {Array.from({ length: 100 }, (_, i) => currentYear - 50 + i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <div key={idx} className="text-center text-xs font-semibold text-gray-600 p-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <button
              onClick={handleToday}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              Today
            </button>

            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
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
  className = ''
}: DatePickerCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    onDateSelect?.(date);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    onDateSelect?.(today);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    const prevMonthDays = getDaysInMonth(currentMonth - 1, currentYear);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(
        <button
          key={`prev-${i}`}
          className="text-gray-400 hover:bg-gray-100 rounded p-2 text-sm"
        >
          {prevMonthDays - i}
        </button>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate?.toDateString() === date.toDateString();

      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          className={`
            p-2 text-sm rounded transition-colors
            ${isToday ? 'border border-indigo-600' : ''}
            ${isSelected ? 'bg-stone-900 text-white' : 'hover:bg-gray-100'}
          `}
        >
          {day}
        </button>
      );
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(
        <button
          key={`next-${i}`}
          className="text-gray-400 hover:bg-gray-100 rounded p-2 text-sm"
        >
          {i}
        </button>
      );
    }

    return days;
  };

  const calendarSize = size === 'small' ? 'w-72' : 'w-80';

  return (
    <div className={`bg-white border-2 border-gray-300 rounded-lg p-4 ${calendarSize} ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button className="flex items-center gap-1 border-2 border-gray-300 rounded px-3 py-1.5 text-sm bg-[#1C2938] text-white hover:bg-[#2A3F52] transition-colors">
            {months[currentMonth]}
            <ChevronDown className="w-4 h-4" />
          </button>

          <button className="flex items-center gap-1 border-2 border-gray-300 rounded px-3 py-1.5 text-sm bg-[#1C2938] text-white hover:bg-[#2A3F52] transition-colors">
            {currentYear}
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <div key={idx} className="text-center text-xs font-semibold text-gray-600 p-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {renderCalendar()}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <button
          onClick={handleToday}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          Today
        </button>

        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}

export function DatePickerDay({
  day,
  state = 'default',
  isCurrentDate = false
}: {
  day: number;
  state?: 'default' | 'hover' | 'pressed' | 'selected' | 'highlight' | 'disabled' | 'focused';
  isCurrentDate?: boolean;
}) {
  const getStateClasses = () => {
    if (state === 'disabled') {
      return 'bg-gray-100 text-gray-400 cursor-not-allowed';
    }
    if (state === 'selected') {
      return 'bg-stone-900 text-white';
    }
    if (state === 'highlight') {
      return 'bg-stone-900 text-white';
    }
    if (state === 'pressed') {
      return 'bg-indigo-800 text-white';
    }
    if (state === 'hover') {
      return 'bg-gray-100 text-gray-900';
    }
    if (state === 'focused') {
      return 'ring-2 ring-indigo-600 text-gray-900';
    }
    return 'text-gray-900 hover:bg-gray-100';
  };

  return (
    <button
      className={`
        w-10 h-10 flex items-center justify-center rounded text-sm font-medium transition-colors
        ${isCurrentDate ? 'border-2 border-indigo-600' : ''}
        ${getStateClasses()}
      `}
    >
      {day}
    </button>
  );
}
