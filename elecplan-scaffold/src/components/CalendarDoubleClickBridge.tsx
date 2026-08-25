"use client";

import { useEffect } from "react";
import { addDays, format, parseISO } from "date-fns";
import { CAL_HOUR_START, CAL_HOUR_END, CAL_ROW_PX } from "@/lib/week";

function setReactInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function timeValue(totalMinutes: number) {
  const clamped = Math.max(CAL_HOUR_START * 60, Math.min(CAL_HOUR_END * 60 - 15, totalMinutes));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export default function CalendarDoubleClickBridge({ weekStart }: { weekStart: string }) {
  useEffect(() => {
    function handleDoubleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const column = target.closest("[data-day-column]") as HTMLElement | null;
      if (!column) return;
      if (target.closest(".absolute.rounded-lg")) return;

      const visibleColumns = Array.from(document.querySelectorAll<HTMLElement>("[data-day-column]")).filter((el) => el.offsetParent !== null);
      let dayIndex = visibleColumns.length >= 7 ? visibleColumns.indexOf(column) : 0;
      if (dayIndex < 0) dayIndex = 0;
      const date = addDays(parseISO(weekStart), dayIndex);

      const rect = column.getBoundingClientRect();
      const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
      const rawMinutes = CAL_HOUR_START * 60 + (y / CAL_ROW_PX) * 60;
      const startMinutes = Math.round(rawMinutes / 15) * 15;
      const endMinutes = Math.min(startMinutes + 60, CAL_HOUR_END * 60);

      const newEventButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
        (button) => button.offsetParent !== null && button.textContent?.trim().toLowerCase().includes("new event"),
      );
      if (!newEventButton) return;

      event.preventDefault();
      newEventButton.click();
      window.setTimeout(() => {
        const dateInput = document.querySelector<HTMLInputElement>('input[type="date"]');
        const timeInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="time"]'));
        if (dateInput) setReactInputValue(dateInput, format(date, "yyyy-MM-dd"));
        if (timeInputs[0]) setReactInputValue(timeInputs[0], timeValue(startMinutes));
        if (timeInputs[1]) setReactInputValue(timeInputs[1], timeValue(endMinutes));
      }, 0);
    }

    document.addEventListener("dblclick", handleDoubleClick);
    return () => document.removeEventListener("dblclick", handleDoubleClick);
  }, [weekStart]);

  return null;
}
