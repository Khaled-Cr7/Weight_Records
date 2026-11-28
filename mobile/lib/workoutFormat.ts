// "1:05:30" or "12:05" for a running clock
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

// "1h 05m", "42m" or "35s" for a finished workout
export function formatDuration(totalSeconds: number | null): string {
  if (totalSeconds === null) return '-';
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

// 1200 -> "1,200 kg", 62.5 -> "62.5 kg"
export function formatKg(value: number): string {
  return `${Number.isInteger(value) ? value : Math.round(value * 100) / 100} kg`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// "62.5 x 10" for a finished set
export function setText(weightKg: number | null, reps: number | null): string {
  if (weightKg === null || weightKg === 0) return `${reps ?? '-'} reps`;
  return `${weightKg} kg x ${reps ?? '-'}`;
}