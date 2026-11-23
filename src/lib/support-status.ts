// In-memory support status — resets on server restart (acceptable for MVP)

// ── Global availability ────────────────────────────────────────────────────
let supportOnline = true;

export function getSupportStatus(): boolean { return supportOnline; }
export function setSupportStatus(v: boolean): void { supportOnline = v; }

// ── Per-chat agent stealth (admin appears offline/away to that specific user)
const stealthChats = new Set<string>(); // chatIds where admin shows as "away"

export function setAgentStealth(chatId: string, hidden: boolean): void {
  if (hidden) stealthChats.add(chatId);
  else stealthChats.delete(chatId);
}

export function getAgentStealth(chatId: string): boolean {
  return stealthChats.has(chatId);
}
