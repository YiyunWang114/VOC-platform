"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle,
  GripVertical,
  Kanban,
  MessageSquare,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
  feedback: {
    id: string;
    rawContent: string;
    coreIssue: string;
    urgency: string;
  };
}

const columns = [
  { id: "todo", title: "待评估", topBorder: "border-t-yellow-400", icon: Clock },
  { id: "in_progress", title: "处理中", topBorder: "border-t-purple-400", icon: Loader2 },
  { id: "done", title: "已解决", topBorder: "border-t-green-400", icon: CheckCircle },
];

export default function KanbanPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingTicket, setDraggingTicket] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tickets");
      const data = await response.json();
      setTickets(data.data);
    } catch (error) {
      console.error("获取工单失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleDragStart = (ticketId: string) => {
    setDraggingTicket(ticketId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (!draggingTicket) return;

    try {
      const response = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draggingTicket, status }),
      });

      if (response.ok) {
        fetchTickets();
      }
    } catch (error) {
      console.error("更新工单状态失败:", error);
    } finally {
      setDraggingTicket(null);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "P0":
        return "badge-soft-red";
      case "P1":
        return "badge-soft-amber";
      case "P2":
        return "badge-soft-blue";
      default:
        return "badge-soft-gray";
    }
  };

  const getTicketsByStatus = (status: string) => {
    return tickets.filter((ticket) => ticket.status === status);
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-[var(--bg-primary)]">
        {/* Header */}
        <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] border-b border-[var(--border-subtle)]">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  返回首页
                </Link>
                <div className="flex items-center gap-2">
                  <Kanban className="h-5 w-5 text-[var(--accent-primary)]" />
                  <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                    敏捷迭代工单看板
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/voc-hall"
                  className="btn-primary inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  VoC数据大厅
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-[var(--accent-primary)] animate-spin" />
              <span className="ml-2 text-[var(--text-muted)]">加载中...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Clock className="h-12 w-12 text-[var(--border-subtle)] mb-4" />
              <p className="text-[var(--text-muted)]">暂无论工单</p>
              <Link
                href="/voc-hall"
                className="mt-2 text-sm text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition-colors"
              >
                去数据大厅创建工单
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {columns.map((column) => (
                <div
                  key={column.id}
                  className="rounded-2xl bg-[var(--bg-tertiary)] p-4 min-h-[500px]"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  {/* Column Header */}
                  <div className={`flex items-center justify-between mb-4 bg-white rounded-xl px-4 py-3 border-t-4 ${column.topBorder} shadow-soft`}>
                    <div className="flex items-center gap-2">
                      <column.icon className={`h-5 w-5 ${
                        column.id === "todo" ? "text-yellow-500" :
                        column.id === "in_progress" ? "text-purple-500" :
                        "text-green-500"
                      }`} />
                      <h2 className="font-semibold text-[var(--text-primary)]">
                        {column.title}
                      </h2>
                    </div>
                    <span className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                      {getTicketsByStatus(column.id).length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {getTicketsByStatus(column.id).map((ticket) => (
                      <div
                        key={ticket.id}
                        draggable
                        onDragStart={() => handleDragStart(ticket.id)}
                        className={`bg-white rounded-xl shadow-soft p-4 cursor-move hover:border-[var(--accent-primary)] transition-all ${
                          draggingTicket === ticket.id ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-[var(--text-muted)]" />
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityBadge(
                                ticket.priority
                              )}`}
                            >
                              {ticket.priority}
                            </span>
                          </div>
                          {ticket.feedback.urgency === "高" && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>

                        <h3 className="font-medium text-[var(--text-primary)] mb-2">
                          {ticket.title}
                        </h3>

                        <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
                          {ticket.description}
                        </p>

                        <div className="border-t border-[var(--border-subtle)] pt-3">
                          <p className="text-xs text-[var(--text-muted)] mb-1">
                            关联原声：
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-lg p-2">
                            {ticket.feedback.coreIssue}
                          </p>
                        </div>

                        <div className="mt-3 text-xs text-[var(--text-muted)]">
                          创建于{" "}
                          {new Date(ticket.createdAt).toLocaleDateString("zh-CN")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
