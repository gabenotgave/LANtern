import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
  Brush,
} from "recharts";
import { THRESHOLDS } from "../constants/thresholds";

const BLUE = "#3b82f6";
const AMBER = "#fbbf24";
const GRAY = "#9ca3af";
const RED_FILL = "#ef4444";

function formatTime(val) {
  try {
    return new Date(val).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return val;
  }
}

function computeWarningRanges(data) {
  if (!Array.isArray(data) || data.length === 0) return [];
  const ranges = [];
  let start = null;
  for (let i = 0; i < data.length; i++) {
    const v = data[i]?.ping_external_avg_ms;
    const inWarning = v != null && v > THRESHOLDS.PING_WARN_MS;
    if (inWarning && start === null) start = data[i]?.timestamp ?? i;
    if (!inWarning && start !== null) {
      ranges.push({ start, end: data[i - 1]?.timestamp ?? data[i]?.timestamp });
      start = null;
    }
  }
  if (start !== null && data.length > 0) {
    ranges.push({ start, end: data[data.length - 1]?.timestamp });
  }
  return ranges;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length || !label) return null;
  const ts = typeof label === "string" ? label : payload[0]?.payload?.timestamp ?? label;
  return (
    <div className="dark:bg-gray-900 bg-white rounded-lg shadow-md border border-gray-100 p-3 text-xs">
      <div className="dark:text-gray-300 text-gray-500 font-normal mb-1">{ts}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex gap-2">
          <span style={{ color: p.color }}>{p.name}:</span>
          <span className="dark:text-gray-200 text-gray-800 font-medium">{p.value != null ? Number(p.value).toFixed(1) : "—"}</span>
        </div>
      ))}
    </div>
  );
}

export default function TimeSeriesChart({ data }) {
  if (!data?.length) return null;

  const warningRanges = computeWarningRanges(data);

  return (
    <div className="dark:bg-zinc-800 bg-white rounded-2xl shadow-sm border dark:border-zinc-700 border-gray-100 p-5">
      <h2 className="dark:text-gray-200 text-gray-700  font-medium text-sm mb-4">Network performance over time</h2>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#737b88" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            stroke="#737b88"
            tick={{ fill: "#737b88" }}
            fontSize={11}
          />
          <YAxis stroke="#737b88" fontSize={11} tickFormatter={(v) => (v != null ? String(v) : "")} />
          <YAxis yAxisId="right" orientation="right" stroke="#737b88" tick={{ fill: "#737b88" }} fontSize={11} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: "#e5e7eb" }}/>
          {warningRanges.map((r, i) => (
            <ReferenceArea
              key={i}
              x1={r.start}
              x2={r.end}
              fill={RED_FILL}
              fillOpacity={0.08}
            />
          ))}
          <Line
            type="monotone"
            dataKey="http_ttfb_ms"
            name="TTFB (ms)"
            stroke={BLUE}
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="ping_external_avg_ms"
            name="External ping (ms)"
            stroke={AMBER}
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="device_count"
            name="Devices"
            yAxisId="right"
            stroke={GRAY}
            strokeDasharray="4 4"
            dot={false}
            strokeWidth={2}
          />
          <Brush dataKey="timestamp" height={24} stroke="#9ca3af" fill="#1f2937" tickFormatter={formatTime} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
