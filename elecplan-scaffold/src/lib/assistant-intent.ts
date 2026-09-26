export type AssistantIntent = "calendar-read" | "reminder" | "schedule" | "unsupported" | "capabilities" | "content";

export function isExplicitReminder(text: string): boolean {
  return /\b(remind me|set (?:me )?(?:a )?reminder|create (?:a )?reminder|add (?:a )?reminder|(?:my |the )?(?:to[ -]?do|task) list)\b/i.test(text);
}

export function assistantIntent(instruction: string): AssistantIntent {
  const text = instruction.trim();
  if (!text) return "content";
  if (isExplicitReminder(text) && !/\b(?:and (?:then )?|also )(?:send|email|text|deduct|invoice|schedule|book|delete|update|create|mark)\b/i.test(text)) return "reminder";
  if (/\b(what can you do|your capabilities|available commands|supported commands|what commands)\b/i.test(text)) return "capabilities";
  if (/\b(send|email|text|sms|message|notify|invoice|charge|refund|pay|sync|synchronise|synchronize|deduct|subtract|consume|restock|reschedule|cancel|delete|remove|rename|archive|reopen)\b/i.test(text)
      || /\b(?:we |i )?(?:used|use)\s+\d/i.test(text)
      || /\b(?:record|log|add|update|change|create|make|draft|prepare|finish|complete|mark)\b[\s\S]*\b(?:materials?|stock|inventory|invoice|quote|client|contact|job|hours|timesheet|bill|note|equipment|certificate)\b/i.test(text)) {
    const simpleCalendarCreate = /\b(?:create|add|make)\b[\s\S]*\b(?:calendar event|calendar booking)\b/i.test(text)
      && !/\b(send|email|text|sms|invoice|deduct|delete|update|complete|cancel|reschedule)\b/i.test(text);
    if (!simpleCalendarCreate) return "unsupported";
  }
  const mutation = /\b(schedule|book|booking for|put[\s\S]*calendar|add[\s\S]*calendar|create[\s\S]*(?:event|booking))\b/i.test(text);
  const question = /\b(available|availability|free|what(?:'s| is) on|what (?:do i|have i)|am i booked|show|check|list)\b/i.test(text);
  if (question && !mutation) return "calendar-read";
  if (mutation) return "schedule";
  return "content";
}

export const ASSISTANT_CAPABILITIES_SUMMARY = "Connected commands: check the Elecplan calendar, propose new calendar bookings, and create reminders/to-do items after you review them. Invoice/quote actions, stock deductions, job completion, job checklists, SMS/email sending and Xero financial sync are not connected to the assistant yet.";
export const UNSUPPORTED_ACTION_SUMMARY = "That action is not connected to the Elecplan assistant yet. No invoice, message, stock adjustment or other portal change has been made. " + ASSISTANT_CAPABILITIES_SUMMARY;

export function assistantTargetDate(text: string, today: Date): Date | null {
  const makeDate = (year: number, month: number, day: number): Date | null => {
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
  };
  const iso = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) return makeDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const au = text.match(/\b(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?\b/);
  if (au) {
    let year = au[3] ? Number(au[3]) : today.getUTCFullYear();
    if (year < 100) year += 2000;
    return makeDate(year, Number(au[2]), Number(au[1]));
  }
  if (/\btomorrow\b/i.test(text)) return new Date(today.getTime() + 86400000);
  if (/\btoday\b/i.test(text)) return new Date(today);
  const days = ["sun(?:day)?", "mon(?:day)?", "tue(?:s|sday)?", "wed(?:nesday)?", "thu(?:r|rs|rsday)?", "fri(?:day)?", "sat(?:urday)?"];
  const target = days.findIndex(day => new RegExp(`\\b${day}\\b`, "i").test(text));
  if (target < 0) return null;
  let delta = (target - today.getUTCDay() + 7) % 7;
  if (/\bnext week\b/i.test(text)) delta = 7 - ((today.getUTCDay() + 6) % 7) + ((target + 6) % 7);
  else if (/\bnext\b/i.test(text) && delta === 0) delta = 7;
  return new Date(today.getTime() + delta * 86400000);
}
