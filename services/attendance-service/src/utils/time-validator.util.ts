const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export function todayName(date = new Date()): string {
  return DAYS[date.getDay()]!;
}

export function currentTimeValue(date = new Date()): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function isScheduleCurrent(schedule: {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}, date = new Date()): boolean {
  const now = currentTimeValue(date);
  return schedule.dayOfWeek === todayName(date) && schedule.startTime <= now && now <= schedule.endTime;
}

export function expiresAtForScheduleEnd(schedule: { endTime: string }, date = new Date()): Date {
  const [hours = '0', minutes = '0'] = schedule.endTime.split(':');
  const expiresAt = new Date(date);
  expiresAt.setHours(Number(hours), Number(minutes), 59, 999);

  if (expiresAt <= date) {
    return new Date(date.getTime() + 30 * 1000);
  }

  return expiresAt;
}
