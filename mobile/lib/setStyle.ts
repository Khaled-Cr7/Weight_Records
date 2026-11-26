import type { SetType } from '@/services/types/program';

// One look for each kind of set, used everywhere sets are shown
export const SET_STYLE: Record<
  SetType,
  { label: string; short: string; bg: string; text: string; border: string }
> = {
  NORMAL: { label: 'Working set', short: 'sets', bg: '#1D3558', text: '#8CB5EC', border: '#2F5185' },
  WARMUP: { label: 'Warm-up', short: 'warm-up', bg: '#3B2E12', text: '#F2C46D', border: '#6B5224' },
  DROP: { label: 'Drop set', short: 'drop', bg: '#2E2347', text: '#B9A0F2', border: '#54417F' },
};