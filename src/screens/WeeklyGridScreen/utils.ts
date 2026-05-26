// Parse time string (HH:MM) to minutes from midnight
export const parseTime = (timeStr: string): number | null => {
  if (!timeStr) return null;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

// Validate HH:MM time format
export const isValidTime = (timeStr: string): boolean => {
  return parseTime(timeStr) !== null;
};

// Format time input as the user types (auto-insert colon)
export const formatTimeInput = (text: string): string => {
  const digits = text.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
};

// Get week's date range (Monday to Sunday) with offset, formatted for display
export const getWeekDateRange = (weekOffset: number = 0): string => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset + (weekOffset * 7));

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const formatDate = (date: Date) => `${months[date.getMonth()]} ${date.getDate()}`;

  if (monday.getMonth() === sunday.getMonth()) {
    return `${formatDate(monday)} - ${sunday.getDate()}, ${sunday.getFullYear()}`;
  }
  return `${formatDate(monday)} - ${formatDate(sunday)}, ${sunday.getFullYear()}`;
};

// Get the Monday Date for a given week offset
export const getWeekMonday = (weekOffset: number = 0): Date => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset + (weekOffset * 7));
  monday.setHours(0, 0, 0, 0);

  return monday;
};

// Check if a given day index is today for a specific week offset
export const isDayToday = (dayIndex: number, weekOffset: number): boolean => {
  if (weekOffset !== 0) return false;
  const today = new Date();
  const todayDayOfWeek = today.getDay();
  const adjustedToday = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;
  return dayIndex === adjustedToday;
};

// Get month name and year for a given month offset
export const getMonthDateRange = (monthOffset: number = 0): string => {
  const today = new Date();
  const targetDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
};

// Get all days in a month grid (6 rows × 7 days = 42 cells, padded from prev/next months)
export const getMonthGrid = (monthOffset: number = 0): { date: Date; isCurrentMonth: boolean; isToday: boolean }[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();

  let firstDayOfWeek = new Date(year, month, 1).getDay();
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const grid: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = [];

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, daysInPrevMonth - i);
    grid.push({
      date,
      isCurrentMonth: false,
      isToday: date.getTime() === today.getTime(),
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    grid.push({
      date,
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
    });
  }

  const remaining = 42 - grid.length;
  for (let day = 1; day <= remaining; day++) {
    const date = new Date(year, month + 1, day);
    grid.push({
      date,
      isCurrentMonth: false,
      isToday: date.getTime() === today.getTime(),
    });
  }

  return grid;
};
