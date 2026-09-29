"use client";

import {
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type AreaData,
  type Time,
  createChart,
} from "lightweight-charts";
import { memo, useEffect, useRef } from "react";

import type { PricePoint, Tick } from "@/types";

type LightweightPriceChartProps = {
  data: PricePoint[];
  liveTick?: Tick;
  lineColor: string;
};

export const LightweightPriceChart = memo(function LightweightPriceChart({
  data,
  liveTick,
  lineColor,
}: LightweightPriceChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(226, 232, 240, 0.72)",
      },
      grid: {
        horzLines: { color: "rgba(148, 163, 184, 0.12)" },
        vertLines: { color: "rgba(148, 163, 184, 0.08)" },
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.18)",
        scaleMargins: {
          top: 0.12,
          bottom: 0.16,
        },
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.18)",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
    });
    const series = chart.addAreaSeries({
      lineColor,
      topColor: colorWithAlpha(lineColor, 0.22),
      bottomColor: colorWithAlpha(lineColor, 0),
      lineWidth: 2,
      priceLineColor: lineColor,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [lineColor]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) {
      return;
    }

    series.setData(
      data
        .filter((point) => Number.isFinite(Number(point.value)) && Number.isFinite(point.time))
        .map<AreaData>((point) => ({
          time: point.time as Time,
          value: Number(point.value),
        })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  useEffect(() => {
    if (!liveTick || !seriesRef.current) {
      return;
    }

    seriesRef.current.update({
      time: liveTick.epoch as Time,
      value: Number(liveTick.price),
    });
  }, [liveTick]);

  return <div ref={containerRef} className="h-full min-h-[300px] w-full" />;
});

function colorWithAlpha(color: string, alpha: number) {
  if (color.startsWith("#")) {
    const red = Number.parseInt(color.slice(1, 3), 16);
    const green = Number.parseInt(color.slice(3, 5), 16);
    const blue = Number.parseInt(color.slice(5, 7), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  return color;
}
