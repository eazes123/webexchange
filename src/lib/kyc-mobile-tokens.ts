export type TokenEntry = { sessionToken: string; expiresAt: number };

declare global {
  // eslint-disable-next-line no-var
  var _kycMobileTokens: Map<string, TokenEntry> | undefined;
}

export const mobileTokenMap: Map<string, TokenEntry> =
  globalThis._kycMobileTokens ?? (globalThis._kycMobileTokens = new Map());

export function pruneExpiredTokens() {
  const now = Date.now();
  for (const [k, v] of mobileTokenMap) {
    if (now > v.expiresAt) mobileTokenMap.delete(k);
  }
}
