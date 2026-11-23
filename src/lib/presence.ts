// In-memory user presence tracker per support chatId
// Works for single-process deployments; resets on server restart (acceptable for MVP)

const presenceMap = new Map<string, number>(); // chatId → last seen ms

const ONLINE_THRESHOLD_MS = 15_000; // 15 seconds

export function touchPresence(chatId: string): void {
  presenceMap.set(chatId, Date.now());
}

export function isUserOnline(chatId: string): boolean {
  const last = presenceMap.get(chatId);
  return !!last && Date.now() - last < ONLINE_THRESHOLD_MS;
}
