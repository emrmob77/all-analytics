'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export interface DateRange {
  from: Date;
  to: Date;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}
function fmtShort(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstWeekday(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

const PRESETS = [
  { label: 'Today',        fn: () => { const t = today(); return { from: t, to: t }; } },
  { label: 'Yesterday',    fn: () => { const y = addDays(today(), -1); return { from: y, to: y }; } },
  { label: 'Last 7 days',  fn: () => ({ from: addDays(today(), -6),  to: today() }) },
  { label: 'Last 30 days', fn: () => ({ from: addDays(today(), -29), to: today() }) },
  { label: 'Last 90 days', fn: () => ({ from: addDays(today(), -89), to: today() }) },
];

function matchPreset(value: DateRange): string | null {
  for (const p of PRESETS) {
    const r = p.fn();
    if (sameDay(value.from, r.from) && sameDay(value.to, r.to)) return p.label;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Mini Calendar
// ---------------------------------------------------------------------------

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface MiniCalendarProps {
  year: number;
  month: number;
  selected: DateRange | null;
  hovered: Date | null;
  onDayClick: (d: Date) => void;
  onDayHover: (d: Date) => void;
}

function MiniCalendar({ year, month, selected, hovered, onDayClick, onDayHover }: MiniCalendarProps) {
  const totalDays = daysInMonth(year, month);
  const startWd = firstWeekday(year, month);
  const todayDate = today();
  const maxDate = todayDate;

  const cells: (Date | null)[] = [
    ...Array(startWd).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => new Date(year, month, i + 1)),
  ];
  // pad to complete weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const rangeFrom = selected?.from ?? null;
  const rangeTo = selected?.to ?? hovered ?? null;
  const rangeStart = rangeFrom && rangeTo ? (rangeFrom <= rangeTo ? rangeFrom : rangeTo) : rangeFrom;
  const rangeEnd   = rangeFrom && rangeTo ? (rangeFrom <= rangeTo ? rangeTo : rangeFrom) : null;

  function classify(d: Date) {
    const isDisabled = d > maxDate;
    const isToday = sameDay(d, todayDate);
    const isStart = rangeStart ? sameDay(d, rangeStart) : false;
    const isEnd   = rangeEnd   ? sameDay(d, rangeEnd)   : false;
    const inRange = rangeStart && rangeEnd ? d > rangeStart && d < rangeEnd : false;
    return { isDisabled, isToday, isStart, isEnd, inRange };
  }

  return (
    <div style={{ width: 224 }}>
      <div className="mb-2 text-center text-[12px] font-semibold text-[#202124]">
        {monthLabel(year, month)}
      </div>
      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7">
        {WEEK_DAYS.map(w => (
          <div key={w} className="text-center text-[10px] font-medium text-[#9AA0A6]">{w}</div>
        ))}
      </div>
      {/* Days grid */}
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const { isDisabled, isToday, isStart, isEnd, inRange } = classify(d);

          let bg = '';
          let textColor = isDisabled ? 'text-[#D0D3D6]' : 'text-[#202124]';
          let cursor = isDisabled ? 'cursor-not-allowed' : 'cursor-pointer';
          let rounded = 'rounded-[4px]';

          if (isStart || isEnd) {
            bg = 'bg-[#1A73E8]';
            textColor = 'text-white';
            rounded = isStart && isEnd ? 'rounded-[4px]' : isStart ? 'rounded-l-[4px] rounded-r-none' : 'rounded-r-[4px] rounded-l-none';
          } else if (inRange) {
            bg = 'bg-[#E8F0FE]';
            textColor = 'text-[#1A73E8]';
            rounded = 'rounded-none';
          }

          // Outer cell background: creates the continuous range band.
          // - inRange: full width #E8F0FE
          // - isStart only: right half #E8F0FE (band continues to the right)
          // - isEnd only: left half #E8F0FE (band continues from the left)
          // - isStart && isEnd (single day): no band
          const outerBg =
            inRange
              ? 'bg-[#E8F0FE]'
              : isStart && !isEnd
              ? '[background:linear-gradient(to_right,transparent_50%,#E8F0FE_50%)]'
              : isEnd && !isStart
              ? '[background:linear-gradient(to_left,transparent_50%,#E8F0FE_50%)]'
              : '';

          return (
            <div
              key={i}
              className={`flex h-8 items-center justify-center ${outerBg}`}
            >
              <button
                disabled={isDisabled}
                onClick={() => !isDisabled && onDayClick(d)}
                onMouseEnter={() => !isDisabled && onDayHover(d)}
                className={`flex h-[28px] w-[28px] items-center justify-center text-[11.5px] font-medium transition-colors ${rounded} ${bg} ${textColor} ${cursor} ${
                  !isDisabled && !isStart && !isEnd && !inRange ? 'hover:bg-[#F1F3F4]' : ''
                } ${isToday && !isStart && !isEnd ? 'font-bold text-[#1A73E8]' : ''}`}
              >
                {d.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DateRangePicker
// ---------------------------------------------------------------------------

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  maxDays?: number;
}

export function DateRangePicker({ value, onChange, maxDays = 365 }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  // Two-click selection: first click = from, second = to
  const [pickFrom, setPickFrom] = useState<Date | null>(null);
  const [hovered, setHovered] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Navigate months — left calendar shows month1, right shows month1+1
  const now = new Date();
  const [navYear, setNavYear] = useState(() => {
    return now.getMonth() - 1 < 0 ? now.getFullYear() - 1 : now.getFullYear();
  });
  const [navMonth, setNavMonth] = useState(now.getMonth() - 1 < 0 ? 11 : now.getMonth() - 1);

  const ref = useRef<HTMLDivElement>(null);

  const month1Year  = navYear;
  const month1Month = navMonth;
  const month2Month = (month1Month + 1) % 12;
  const month2Year  = month1Month === 11 ? month1Year + 1 : month1Year;

  const activePreset = pickFrom ? null : matchPreset(value);
  const label = `${fmtShort(value.from)} – ${fmtShort(value.to)}`;

  // Current partial selection for highlighting
  const currentSelection: DateRange | null = pickFrom
    ? { from: pickFrom, to: pickFrom }
    : value;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setPickFrom(null);
        setHovered(null);
        setError(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleDayClick = useCallback((d: Date) => {
    if (!pickFrom) {
      // First click — set "from"
      setPickFrom(d);
      setError(null);
    } else {
      // Second click — set "to"
      const from = pickFrom <= d ? pickFrom : d;
      const to   = pickFrom <= d ? d : pickFrom;
      const diff = diffDays(from, to) + 1;
      if (diff > maxDays) {
        setError(`Max ${maxDays} days`);
        setPickFrom(null);
        return;
      }
      onChange({ from, to });
      setPickFrom(null);
      setHovered(null);
      setOpen(false);
      setError(null);
    }
  }, [pickFrom, maxDays, onChange]);

  const handleDayHover = useCallback((d: Date) => {
    if (pickFrom) setHovered(d);
  }, [pickFrom]);

  // Partial highlight during selection
  const displaySelection: DateRange | null = pickFrom
    ? {
        from: pickFrom <= (hovered ?? pickFrom) ? pickFrom : (hovered ?? pickFrom),
        to:   pickFrom <= (hovered ?? pickFrom) ? (hovered ?? pickFrom) : pickFrom,
      }
    : value;

  // Minimum navigable month: maxDays before today (lower bound guard)
  const minNavDate = addDays(today(), -maxDays);
  const minNavYear  = minNavDate.getFullYear();
  const minNavMonth = minNavDate.getMonth();

  function prevMonth() {
    if (navYear < minNavYear || (navYear === minNavYear && navMonth <= minNavMonth)) return;
    if (navMonth === 0) { setNavMonth(11); setNavYear(y => y - 1); }
    else setNavMonth(m => m - 1);
  }
  function nextMonth() {
    const maxMonth = now.getMonth() - 1 < 0 ? 11 : now.getMonth() - 1;
    const maxYear  = now.getMonth() - 1 < 0 ? now.getFullYear() - 1 : now.getFullYear();
    if (navYear > maxYear || (navYear === maxYear && navMonth >= maxMonth)) return;
    if (navMonth === 11) { setNavMonth(0); setNavYear(y => y + 1); }
    else setNavMonth(m => m + 1);
  }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => { setOpen(o => !o); setPickFrom(null); setError(null); }}
        className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-[7px] text-xs font-medium transition-colors ${
          open
            ? 'border-[#1A73E8] bg-[#E8F0FE] text-[#1A73E8]'
            : 'border-[#E3E8EF] bg-white text-[#5F6368] hover:bg-gray-50'
        }`}
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <rect x="1" y="2" width="11" height="10" rx="1.5" />
          <path d="M1 5h11M4 1v2M8 1v2" />
        </svg>
        <span className="hidden sm:inline">{label}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 z-50 mt-1.5 flex rounded-xl border border-[#E3E8EF] bg-white shadow-xl">
          {/* Sol — Presetler */}
          <div
            className="flex flex-col border-r border-[#F1F3F4] p-3"
            style={{ width: 144 }}
          >
            <div className="mb-2 px-2 text-[9.5px] font-semibold uppercase tracking-widest text-[#9AA0A6]">
              Quick Select
            </div>
            {PRESETS.map(p => {
              const isActive = !pickFrom && activePreset === p.label;
              return (
                <button
                  key={p.label}
                  onClick={() => {
                    const r = p.fn();
                    onChange(r);
                    setPickFrom(null);
                    setOpen(false);
                  }}
                  className={`rounded-md px-2.5 py-[7px] text-left text-xs transition-colors ${
                    isActive
                      ? 'bg-[#E8F0FE] font-semibold text-[#1A73E8]'
                      : 'text-[#5F6368] hover:bg-[#F8F9FA]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}

            {/* Seçim durumu */}
            <div className="mt-auto border-t border-[#F1F3F4] pt-3">
              {pickFrom ? (
                <>
                  <div className="mb-1 text-[9.5px] font-semibold uppercase tracking-widest text-[#1A73E8]">
                    Select end date
                  </div>
                  <div className="text-[11px] text-[#5F6368]">{fmtShort(pickFrom)} →</div>
                </>
              ) : (
                <>
                  <div className="mb-1 text-[9.5px] font-semibold uppercase tracking-widest text-[#9AA0A6]">
                    Selected
                  </div>
                  <div className="text-[11px] text-[#5F6368]">
                    {fmtShort(value.from)} – {fmtShort(value.to)}
                  </div>
                  <div className="mt-0.5 text-[11px] font-semibold text-[#1A73E8]">
                    {diffDays(value.from, value.to) + 1} days
                  </div>
                </>
              )}
              {error && <div className="mt-1 text-[11px] text-[#C5221F]">{error}</div>}
            </div>
          </div>

          {/* Sağ — Takvimler */}
          <div className="p-4">
            {/* Nav row */}
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="flex h-6 w-6 items-center justify-center rounded border border-[#E3E8EF] text-[#5F6368] hover:bg-[#F1F3F4]"
              >
                ‹
              </button>
              <div />
              <button
                onClick={nextMonth}
                className="flex h-6 w-6 items-center justify-center rounded border border-[#E3E8EF] text-[#5F6368] hover:bg-[#F1F3F4]"
              >
                ›
              </button>
            </div>

            {/* İki ay yanyana */}
            <div className="flex gap-5">
              <MiniCalendar
                year={month1Year}
                month={month1Month}
                selected={displaySelection}
                hovered={hovered}
                onDayClick={handleDayClick}
                onDayHover={handleDayHover}
              />
              <div className="w-px bg-[#F1F3F4]" />
              <MiniCalendar
                year={month2Year}
                month={month2Month}
                selected={displaySelection}
                hovered={hovered}
                onDayClick={handleDayClick}
                onDayHover={handleDayHover}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
