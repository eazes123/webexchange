import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  if (price >= 1) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }
  if (price >= 0.001) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 5,
    }).format(price);
  }
  return `$${price.toFixed(8)}`;
}

export function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9)  return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6)  return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3)  return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

export function formatChange(change: number): string {
  return `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
}

export function getChangeColor(change: number): string {
  return change >= 0 ? "text-ex-green" : "text-ex-red";
}

export function getChangeBg(change: number): string {
  return change >= 0
    ? "bg-ex-green/10 text-ex-green"
    : "bg-ex-red/10 text-ex-red";
}

export function shimmer(w: number, h: number): string {
  return `
  <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g">
        <stop stop-color="#1a2035" offset="20%"/>
        <stop stop-color="#2d3548" offset="50%"/>
        <stop stop-color="#1a2035" offset="70%"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="#1a2035"/>
    <rect id="r" width="${w}" height="${h}" fill="url(#g)"/>
    <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"/>
  </svg>`;
}
