"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Bell, CheckCircle, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export default function AlertsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchEvents();
    fetchRules();
  }, [refreshKey]);

  const fetchEvents = () => {
    fetch("/api/competitor/alerts")
      .then((r) => r.json())
      .then((d) => setEvents(d.events || []))
      .catch(console.error);
  };

  const fetchRules = () => {
    fetch("/api/competitor/alerts")
      .then((r) => r.json())
      .then((d) => setRules([])) // 简化，实际应单独获取规则
      .catch(console.error);
  };

  const checkAlerts = () => {
    fetch("/api/competitor/alerts?check=true")
      .then((r) => r.json())
      .then(() => {
        fetchEvents();
        alert("告警检查完成");
      })
      .catch(console.error);
  };

  const markAsRead = (id: string) => {
    setEvents(events.map((e) => (e.id === id ? { ...e, isRead: true } : e)));
  };

  return (
    <AppShell>
      <main className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <div className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/competitor-insight"
                  className="inline-flex items-center text-sm transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  返回
                </Link>
                <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                  竞品动态告警
                </h1>
                <button
                  onClick={() => setRefreshKey((k) => k + 1)}
                  className="inline-flex items-center transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                  title="刷新"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={checkAlerts}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors btn-primary"
              >
                <Bell className="h-4 w-4" />
                立即检查
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* 告警统计 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-4 text-center">
              <div className="text-2xl font-mono-data text-[#f43f5e]">
                {events.filter((e) => e.severity === "high").length}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>高风险</div>
            </div>
            <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-4 text-center">
              <div className="text-2xl font-mono-data text-[#f59e0b]">
                {events.filter((e) => e.severity === "medium").length}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>中风险</div>
            </div>
            <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-4 text-center">
              <div className="text-2xl font-mono-data" style={{ color: "var(--text-primary)" }}>
                {events.filter((e) => !e.isRead).length}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>未读</div>
            </div>
          </div>

          {/* 告警事件列表 */}
          <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              告警事件
            </h2>
            {events.length === 0 ? (
              <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无告警事件</p>
                <p className="text-sm mt-2">
                  点击"立即检查"按钮手动触发告警扫描
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      event.severity === "high"
                        ? "bg-red-50 border-red-200 pulse-alert"
                        : event.severity === "medium"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-gray-50 border-gray-200"
                    } ${event.isRead ? "opacity-60" : ""}`}
                  >
                    <div
                      className={`mt-1 ${
                        event.severity === "high"
                          ? "text-[#f43f5e]"
                          : event.severity === "medium"
                          ? "text-[#f59e0b]"
                          : "text-gray-400"
                      }`}
                    >
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                          {event.title}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            event.severity === "high"
                              ? "bg-red-100 text-[#f43f5e]"
                              : "bg-amber-100 text-[#f59e0b]"
                          }`}
                        >
                          {event.severity === "high"
                            ? "高风险"
                            : event.severity === "medium"
                            ? "中风险"
                            : "低风险"}
                        </span>
                      </div>
                      <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        {event.description}
                      </p>
                      <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                        {new Date(event.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!event.isRead && (
                      <button
                        onClick={() => markAsRead(event.id)}
                        className="transition-colors"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
