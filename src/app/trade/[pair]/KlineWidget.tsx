"use client";
// Loaded only via next/dynamic ssr:false — top-level klinecharts import is safe.
import { useState, useEffect, useRef } from "react";
import { init, dispose } from "klinecharts";
import type { DataLoader, Period } from "klinecharts";
import { Trash2 } from "lucide-react";

type IvKey = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

const IVS: IvKey[] = ["1m", "5m", "15m", "1h", "4h", "1d"];

const IV_TO_PERIOD: Record<IvKey, Period> = {
  "1m":  { type: "minute", span: 1 },
  "5m":  { type: "minute", span: 5 },
  "15m": { type: "minute", span: 15 },
  "1h":  { type: "hour",   span: 1 },
  "4h":  { type: "hour",   span: 4 },
  "1d":  { type: "day",    span: 1 },
};

function periodToBinance(p: Period): string {
  if (p.type === "minute") return `${p.span}m`;
  if (p.type === "hour")   return `${p.span}h`;
  if (p.type === "day")    return `${p.span}d`;
  return "1h";
}

const DRAWS = [
  { id: "trendLine",              label: "Trend" },
  { id: "horizontalStraightLine", label: "H Line" },
  { id: "verticalStraightLine",   label: "V Line" },
  { id: "fibonacciLine",          label: "Fib" },
  { id: "rect",                   label: "Rect" },
] as const;

const INDS_MAIN = ["MA", "EMA", "BOLL"] as const;
const INDS_SUB  = ["VOL", "MACD", "RSI", "KDJ"] as const;

const KSTYLES = {
  grid: {
    horizontal: { color: "#111", style: "dashed" as const, dashedValue: [2, 2] },
    vertical:   { show: false },
  },
  candle: {
    bar: {
      upColor: "#0ecb81",   downColor: "#f6465d",   noChangeColor: "#888",
      upBorderColor: "#0ecb81", downBorderColor: "#f6465d",
      upWickColor: "#0ecb81",   downWickColor: "#f6465d",
    },
    priceMark: {
      last: {
        upColor: "#0ecb81", downColor: "#f6465d",
        line: { show: true, style: "dashed" as const, dashedValue: [4, 4] },
        text: {
          upBackgroundColor: "#0ecb81", downBackgroundColor: "#f6465d",
          color: "#fff", upColor: "#fff", downColor: "#fff",
        },
      },
    },
  },
  indicator: {
    lines: [
      { color: "#f0b90b" }, { color: "#2196F3" },
      { color: "#E91E63" }, { color: "#00BCD4" }, { color: "#9C27B0" },
    ],
    bars: [{ upColor: "rgba(14,203,129,.7)", downColor: "rgba(246,70,93,.7)", noChangeColor: "#888" }],
    circles: [{ upColor: "rgba(14,203,129,.7)", downColor: "rgba(246,70,93,.7)", noChangeColor: "#888" }],
  },
  xAxis: {
    axisLine: { show: false }, tickLine: { show: false },
    tickText: { color: "#6b7280", size: 11 },
  },
  yAxis: {
    axisLine: { show: false }, tickLine: { show: false },
    tickText: { color: "#6b7280", size: 11 },
  },
  crosshair: {
    horizontal: {
      line: { color: "#555e72", style: "dashed" as const, dashedValue: [4, 4] },
      text: { color: "#d1d4dc", backgroundColor: "#111", borderColor: "#555e72" },
    },
    vertical: {
      line: { color: "#555e72", style: "dashed" as const, dashedValue: [4, 4] },
      text: { color: "#d1d4dc", backgroundColor: "#111", borderColor: "#555e72" },
    },
  },
  separator: { color: "#1e1e1e" },
};

export default function KlineWidget({ base }: { base: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<ReturnType<typeof init> | null>(null);
  const wsRef        = useRef<WebSocket | null>(null);
  const indPanes     = useRef<Record<string, string>>({});
  const [iv, setIv]  = useState<IvKey>("1h");
  const [activeInds, setActiveInds] = useState<Set<string>>(new Set(["VOL"]));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = init(el, { styles: KSTYLES, timezone: "Etc/UTC" });
    if (!chart) return;
    chartRef.current = chart;

    // Create initial VOL indicator in a sub-pane
    try {
      const pid = chart.createIndicator("VOL");
      if (pid) indPanes.current["VOL"] = pid;
    } catch {}

    // DataLoader: KlineCharts v10 pulls data through this interface
    const loader: DataLoader = {
      getBars: ({ type, timestamp, symbol, period, callback }) => {
        const binIv = periodToBinance(period);
        let url = `https://api.binance.com/api/v3/klines?symbol=${symbol.ticker}&interval=${binIv}&limit=500`;
        if (type === "backward" && timestamp != null) {
          url += `&endTime=${timestamp - 1}`;
        }
        fetch(url)
          .then(r => r.json())
          .then((d: any[]) => {
            callback(
              d.map(k => ({ timestamp: k[0], open: +k[1], high: +k[2], low: +k[3], close: +k[4], volume: +k[5] })),
              type === "backward" ? d.length >= 500 : false,
            );
          })
          .catch(() => callback([], false));
      },
      subscribeBar: ({ symbol, period, callback }) => {
        const binIv = periodToBinance(period);
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.ticker.toLowerCase()}@kline_${binIv}`);
        wsRef.current = ws;
        ws.onmessage = e => {
          try {
            const { k } = JSON.parse(e.data);
            callback({ timestamp: k.t, open: +k.o, high: +k.h, low: +k.l, close: +k.c, volume: +k.v });
          } catch {}
        };
      },
      unsubscribeBar: () => {
        wsRef.current?.close();
        wsRef.current = null;
      },
    };

    chart.setDataLoader(loader);
    chart.setSymbol({ ticker: `${base}USDT`, pricePrecision: 2, volumePrecision: 4 });
    chart.setPeriod(IV_TO_PERIOD["1h"]);

    const ro = new ResizeObserver(() => { try { chart.resize(); } catch {} });
    ro.observe(el);

    return () => {
      ro.disconnect();
      wsRef.current?.close();
      wsRef.current = null;
      chartRef.current = null;
      try { dispose(el); } catch {}
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update period when interval changes
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.setPeriod(IV_TO_PERIOD[iv]);
  }, [iv]);

  // Update symbol when trading pair changes
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.setSymbol({ ticker: `${base}USDT`, pricePrecision: 2, volumePrecision: 4 });
  }, [base]);

  const toggleInd = (name: string) => {
    const chart = chartRef.current;
    if (!chart) return;
    if (activeInds.has(name)) {
      const pid = indPanes.current[name];
      try { chart.removeIndicator(pid ? { paneId: pid, name } : { name }); } catch {}
      delete indPanes.current[name];
      setActiveInds(p => { const n = new Set(p); n.delete(name); return n; });
    } else {
      try {
        if ((INDS_MAIN as readonly string[]).includes(name)) {
          chart.createIndicator({ name, paneId: "candle_pane" });
          indPanes.current[name] = "candle_pane";
        } else {
          const pid = chart.createIndicator(name);
          if (pid) indPanes.current[name] = pid;
        }
        setActiveInds(p => new Set(p).add(name));
      } catch {}
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#080808" }}>
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[#1e1e1e] flex-shrink-0 overflow-x-auto">
        {IVS.map(i => (
          <button key={i} onClick={() => setIv(i)}
            className={`px-2 py-1 text-xs rounded font-semibold transition-colors flex-shrink-0 ${
              iv === i ? "bg-[#f0b90b] text-black" : "text-gray-500 hover:text-gray-300"
            }`}>{i}</button>
        ))}

        <div className="w-px h-4 bg-[#1e1e1e] mx-1 flex-shrink-0" />

        {DRAWS.map(t => (
          <button key={t.id}
            onClick={() => { try { chartRef.current?.createOverlay(t.id); } catch {} }}
            className="px-2 py-1 text-[11px] rounded text-gray-500 hover:text-gray-200 hover:bg-[#111] transition-colors flex-shrink-0">
            {t.label}
          </button>
        ))}
        <button onClick={() => { try { chartRef.current?.removeOverlay(); } catch {} }}
          title="Clear drawings"
          className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-[#111] transition-colors flex-shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-[#1e1e1e] mx-1 flex-shrink-0" />

        {[...INDS_MAIN, ...INDS_SUB].map(ind => (
          <button key={ind} onClick={() => toggleInd(ind)}
            className={`px-2 py-1 text-[11px] rounded font-semibold transition-colors flex-shrink-0 ${
              activeInds.has(ind)
                ? "bg-[#f0b90b]/20 text-[#f0b90b]"
                : "text-gray-500 hover:text-gray-300"
            }`}>{ind}</button>
        ))}
      </div>

      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}
