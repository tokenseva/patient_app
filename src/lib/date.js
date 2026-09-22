const DAY_ABBR = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_ABBR_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function toIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function describeDate(date) {
  return {
    iso: toIso(date),
    dayAbbr: DAY_ABBR[date.getDay()],
    dayNum: date.getDate(),
    label: `${DAY_ABBR_LABEL[date.getDay()]} ${date.getDate()} ${MONTH_ABBR[date.getMonth()]}`,
  };
}

export function nextDays(count, from = new Date()) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    out.push(describeDate(d));
  }
  return out;
}

export function monthLabel(date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function monthGrid(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month, d));
  return cells;
}
