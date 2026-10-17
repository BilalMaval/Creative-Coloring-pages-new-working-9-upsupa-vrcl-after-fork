// Time zone helpers for coupon scheduling. No dependencies; works in the browser and in Node (uses Intl).
// Times are always STORED as UTC. Zones are named (America/New_York), never fixed offsets, so daylight saving is automatic.

export const ZONES = [
  { id: 'America/New_York', label: 'US Eastern (New York, Toronto)', short: 'ET' },
  { id: 'America/Chicago', label: 'US Central (Chicago)', short: 'CT' },
  { id: 'America/Denver', label: 'US Mountain (Denver)', short: 'MT' },
  { id: 'America/Los_Angeles', label: 'US Pacific (Los Angeles, Vancouver)', short: 'PT' },
  { id: 'Europe/London', label: 'UK (London)', short: 'UK' },
  { id: 'Europe/Paris', label: 'Central Europe (Paris, Berlin)', short: 'CET' },
  { id: 'Australia/Sydney', label: 'Australia East (Sydney)', short: 'AET' },
  { id: 'UTC', label: 'UTC', short: 'UTC' },
];

export const ZONE_IDS = ZONES.map((z) => z.id);
export const DEFAULT_START_ZONE = 'America/New_York';
export const DEFAULT_END_ZONE = 'America/Los_Angeles';
export const DEFAULT_START_TIME = '00:01';
export const DEFAULT_END_TIME = '23:59';

export const PRESETS = [
  { id: 'us', label: 'US full day', hint: '00:01 Eastern to 23:59 Pacific', startZone: 'America/New_York', endZone: 'America/Los_Angeles' },
  { id: 'uk', label: 'UK full day', hint: '00:01 to 23:59 London', startZone: 'Europe/London', endZone: 'Europe/London' },
  { id: 'global', label: 'Global full day', hint: '00:01 London to 23:59 Pacific', startZone: 'Europe/London', endZone: 'America/Los_Angeles' },
];

// Offset (ms) of `zone` from UTC at the instant `ms`
function offsetAt(ms, zone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(ms));
  const v = {};
  for (const p of parts) v[p.type] = p.value;
  const asUtc = Date.UTC(+v.year, +v.month - 1, +v.day, +v.hour, +v.minute, +v.second);
  return asUtc - Math.floor(ms / 1000) * 1000;
}

// "2026-11-02" + "00:01" in America/New_York  ->  ISO string in UTC. Returns '' when no date is given.
export function zonedToUtcIso(date, time, zone) {
  if (!date) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time || '');
  if (!m || !t || !ZONE_IDS.includes(zone)) throw new Error('Invalid date, time or time zone');
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +t[1], +t[2], 0);
  let guess = wall - offsetAt(wall, zone);
  guess = wall - offsetAt(guess, zone); // second pass settles times that sit next to a daylight-saving change
  return new Date(guess).toISOString();
}

// UTC ISO string -> { date: 'YYYY-MM-DD', time: 'HH:mm' } as the wall clock in `zone`
export function utcIsoToZoned(iso, zone, fallbackTime = '00:00') {
  if (!iso) return { date: '', time: fallbackTime };
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(new Date(iso));
  const v = {};
  for (const p of parts) v[p.type] = p.value;
  return { date: `${v.year}-${v.month}-${v.day}`, time: `${v.hour}:${v.minute}` };
}

// "Sun, Nov 8, 11:59 PM PST" - a moment shown in a given zone, with the zone named
export function formatInZone(iso, zone, withZoneName = true) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: zone, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    ...(withZoneName ? { timeZoneName: 'short' } : {}),
  }).format(new Date(iso));
}
