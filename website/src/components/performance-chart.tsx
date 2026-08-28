import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";

type Point = { day: string; score: number; team: number; target: number };

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-primary px-3 py-2 text-primary-foreground shadow-lift">
      <span className="grid size-6 place-items-center rounded-full bg-primary-foreground/15">
        <TrendingUp className="size-3.5" />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-bold">+{payload[0]?.value}%</p>
        <p className="text-[10px] opacity-70">{label} · punctuality</p>
      </div>
    </div>
  );
}

export function PerformanceChart({ data }: { data: Point[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="fillScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand-blue)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--brand-blue)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fillTeam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand-pink)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--brand-pink)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 6" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            domain={[40, 100]}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border)" }} />
          <Area type="monotone" dataKey="score" stroke="var(--brand-blue)" strokeWidth={2.5} fill="url(#fillScore)" />
          <Area type="monotone" dataKey="team" stroke="var(--brand-pink)" strokeWidth={2} fill="url(#fillTeam)" />
          <Line
            type="monotone"
            dataKey="target"
            stroke="var(--muted-foreground)"
            strokeWidth={1.5}
            strokeDasharray="4 5"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}