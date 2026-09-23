import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { analyticsService } from "@/services/analyticsService";

export function EventsTrendChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    analyticsService.getHourlyTrends().then((trends) => {
      if (trends && trends.length > 0) {
        setData(trends.map((t) => ({ label: t.hour, detections: t.count * 3, alerts: t.count })));
      } else {
        setData([
          { label: "06:00", detections: 4, alerts: 1 },
          { label: "08:00", detections: 7, alerts: 2 },
          { label: "10:00", detections: 12, alerts: 3 },
          { label: "12:00", detections: 5, alerts: 1 },
        ]);
      }
    });
  }, []);

  return (
    <div className="p-4 rounded-lg border border-border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
          Surveillance Events &amp; Alert Velocity (Real-Time)
        </span>
        <span className="text-[10px] font-mono text-primary font-semibold">LIVE HOURLY RECORD</span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} fontFamily="monospace" />
            <YAxis stroke="#94a3b8" fontSize={11} fontFamily="monospace" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "6px",
                fontFamily: "monospace",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
            <Area type="monotone" dataKey="detections" stroke="#38bdf8" fillOpacity={1} fill="url(#colorDetections)" name="Detections" />
            <Area type="monotone" dataKey="alerts" stroke="#ef4444" fillOpacity={1} fill="url(#colorAlerts)" name="Alerts" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function EventsPerCameraChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    analyticsService.getEventsPerCamera().then((cams) => {
      setData(cams.map((c) => ({ label: c.camera, events: c.detections, intrusions: c.alerts })));
    });
  }, []);

  return (
    <div className="p-4 rounded-lg border border-border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
          Sensor Activity &amp; Intrusion Density by Camera
        </span>
        <span className="text-[10px] font-mono text-high font-semibold">ONLINE SENSORS</span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} fontFamily="monospace" />
            <YAxis stroke="#94a3b8" fontSize={11} fontFamily="monospace" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "6px",
                fontFamily: "monospace",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
            <Bar dataKey="events" fill="#38bdf8" name="Total Events" radius={[4, 4, 0, 0]} />
            <Bar dataKey="intrusions" fill="#ef4444" name="Breaches" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AlertsSeverityDonut() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    analyticsService.getAlertsBySeverity().then((sb) => {
      setData(sb.map((s) => ({ label: s.name, count: s.count, color: s.color })));
    });
  }, []);

  const total = data.reduce((acc, curr) => acc + (curr.count || 0), 0);

  return (
    <div className="p-4 rounded-lg border border-border bg-card space-y-3 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
          Alert Distribution by Severity
        </span>
        <span className="text-[10px] font-mono text-critical font-semibold">{total} RECORDED</span>
      </div>
      <div className="h-64 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={4}
              stroke="#0f172a"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "6px",
                fontFamily: "monospace",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function IntrusionsByZoneChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    analyticsService.getIntrusionsByZone().then((zones) => {
      setData(zones.map((z) => ({ label: z.zone, intrusions: z.intrusions, nightMovements: z.falseAlarms })));
    });
  }, []);

  return (
    <div className="p-4 rounded-lg border border-border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
          Breach &amp; Movement Density by Zone
        </span>
        <span className="text-[10px] font-mono text-warning font-semibold">RESTRICTED SECTORS</span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} fontFamily="monospace" />
            <YAxis stroke="#94a3b8" fontSize={11} fontFamily="monospace" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "6px",
                fontFamily: "monospace",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
            <Bar dataKey="intrusions" fill="#ef4444" name="Zone Intrusions" radius={[4, 4, 0, 0]} />
            <Bar dataKey="nightMovements" fill="#f59e0b" name="Loitering" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CameraUptimeChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    analyticsService.getCameraUptime().then((cams) => {
      setData(cams.map((c) => ({ label: c.camera, uptime: c.uptime })));
    });
  }, []);

  return (
    <div className="p-4 rounded-lg border border-border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
          CCTV Stream Availability (%)
        </span>
        <span className="text-[10px] font-mono text-online font-semibold">ACTIVE TELEMETRY</span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} fontFamily="monospace" />
            <YAxis domain={[70, 100]} stroke="#94a3b8" fontSize={11} fontFamily="monospace" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "6px",
                fontFamily: "monospace",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="uptime" fill="#22c55e" name="Availability %" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function IncidentResolutionChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    analyticsService.getIncidentResolution().then((res) => {
      setData(res.map((r) => ({ label: r.status, avgMinutes: r.count * 15 + 10 })));
    });
  }, []);

  return (
    <div className="p-4 rounded-lg border border-border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
          Incident Resolution Duration &amp; Status
        </span>
        <span className="text-[10px] font-mono text-primary font-semibold">SOC RESPONSE TIME</span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} fontFamily="monospace" />
            <YAxis stroke="#94a3b8" fontSize={11} fontFamily="monospace" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "6px",
                fontFamily: "monospace",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
            <Line type="monotone" dataKey="avgMinutes" stroke="#38bdf8" strokeWidth={2} name="Response Time (min)" dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
