/* Recharts lives in its own chunk and only downloads when the organiser opens
   a chart (Trend or Audience). Previously it was imported by Dashboard.jsx,
   which meant every visitor paid ~350 kB of charting code even if they never
   saw a chart. */

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TOOLTIP_STYLE = {
  fontSize: 13,
  borderRadius: 12,
  border: "1px solid #E2DED2",
  background: "#FFFDF7",
  color: "#14131A",
};

const AXIS_TICK = { fontSize: 12, fill: "#8B867A" };

export default function TrendChart({ data, series, height = 220 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: -20, right: 10, top: 10 }}>
        <CartesianGrid stroke="#E7E3D6" vertical={false} />
        <XAxis dataKey="t" tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{ color: "#8B867A" }}
          itemStyle={{ color: "#14131A" }}
        />
        {series.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.stroke}
            strokeWidth={line.width ?? 2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
