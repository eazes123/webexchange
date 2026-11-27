export const GTM_ID = "GTM-PZHS4VCW";

type DataLayerEvent = Record<string, unknown>;

export function gtmPush(data: DataLayerEvent) {
  if (typeof window === "undefined") return;
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push(data);
}

export function gtmEvent(eventName: string, params?: Record<string, unknown>) {
  gtmPush({ event: eventName, ...params });
}
