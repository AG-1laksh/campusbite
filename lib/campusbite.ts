import "server-only";

export const CURRENT_STUDENT_ID = "S001";

export function formatSlot(time: string): string {
  const [hoursText, minutes] = time.slice(0, 5).split(":");
  const hours = Number(hoursText);
  const suffix = hours >= 12 ? "pm" : "am";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes} ${suffix}`;
}
