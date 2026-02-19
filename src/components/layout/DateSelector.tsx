"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { format, addDays, subDays, isToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DayButtonProps } from "react-day-picker";
import { getDefaultClassNames } from "react-day-picker";

interface DateSelectorProps {
  date: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

function createDayButton(datesWithEntries: Set<string>) {
  const DayButtonWithDot = ({ day, modifiers, className, ...props }: DayButtonProps) => {
    const ref = React.useRef<HTMLButtonElement>(null);
    React.useEffect(() => {
      if (modifiers.focused) ref.current?.focus();
    }, [modifiers.focused]);

    const dateStr = day.isoDate ?? format(day.date, "yyyy-MM-dd");
    const hasEntry = datesWithEntries.has(dateStr);
    const defaultClassNames = getDefaultClassNames();

    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        data-day={day.date.toLocaleDateString()}
        data-selected-single={
          modifiers.selected &&
          !modifiers.range_start &&
          !modifiers.range_end &&
          !modifiers.range_middle
        }
        data-range-start={modifiers.range_start}
        data-range-end={modifiers.range_end}
        data-range-middle={modifiers.range_middle}
        className={cn(
          "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-0.5 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md",
          defaultClassNames.day,
          className
        )}
        {...props}
      >
        <span className="flex flex-col items-center justify-center gap-0.5">
          {format(day.date, "d")}
          {hasEntry && (
            <span
              className={cn(
                "h-1 w-1 shrink-0 rounded-full",
                modifiers.selected ? "bg-primary-foreground" : "bg-primary"
              )}
            />
          )}
        </span>
      </Button>
    );
  };
  return DayButtonWithDot;
}

export function DateSelector({ date, onDateChange, className }: DateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(date);
  const [datesWithEntries, setDatesWithEntries] = useState<Set<string>>(new Set());

  const fetchDates = useCallback(async (month: Date) => {
    const monthStr = format(month, "yyyy-MM");
    try {
      const res = await fetch(`/api/v1/calendar/dates?month=${monthStr}`);
      const data = await res.json();
      setDatesWithEntries(new Set(data.dates ?? []));
    } catch {
      setDatesWithEntries(new Set());
    }
  }, []);

  useEffect(() => {
    if (open) {
      setCalendarMonth(date);
      fetchDates(date);
    }
  }, [open, date, fetchDates]);

  const handleMonthChange = (month: Date) => {
    setCalendarMonth(month);
    fetchDates(month);
  };

  const handleSelect = (d: Date | undefined) => {
    if (d) {
      onDateChange(d);
      setOpen(false);
    }
  };

  const goPrev = () => onDateChange(subDays(date, 1));
  const goNext = () => onDateChange(addDays(date, 1));

  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <Button variant="ghost" size="icon" onClick={goPrev} className="h-9 w-9 rounded-xl">
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex-1 rounded-2xl border border-border/50 bg-card px-4 py-2.5 text-center font-medium transition-colors hover:bg-accent",
              isToday(date) && "ring-2 ring-primary/30"
            )}
          >
            {isToday(date) ? "Today" : format(date, "EEE, MMM d")}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            month={calendarMonth}
            onMonthChange={handleMonthChange}
            defaultMonth={date}
            showOutsideDays={false}
            components={{
              DayButton: createDayButton(datesWithEntries),
            }}
          />
        </PopoverContent>
      </Popover>
      <Button variant="ghost" size="icon" onClick={goNext} className="h-9 w-9 rounded-xl">
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
