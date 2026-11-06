"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Users,
  Shield,
  UserCog,
  Trash2,
  Plus,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Modal } from "@/components/ui/Modal";

interface User {
  id: string;
  username: string;
  role: string;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  admin: "系统管理员",
  productManager: "产品经理",
  dataAnalyst: "数据分析师",
  operator: "运营专员",
  customerService: "客服主管",
};

const roleBadgeColors: Record<string, string> = {
  admin: "badge-soft-red",
  productManager: "badge-soft-purple",
  dataAnalyst: "badge-soft-blue",
  operator: "badge-soft-amber",
  customerService: "badge-soft-green",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: "",
    password: "",
    role: "operator",
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("获取用户列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    if (!createForm.username || !createForm.password) return;
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (response.ok) {
        setShowCreateModal(false);
        setCreateForm({ username: "", password: "", role: "operator" });
        fetchUsers();
      }
    } catch (error) {
      console.error("创建用户失败:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除该用户吗？")) return;
    try {
      const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("删除用户失败:", error);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roleLabels[u.role]?.includes(searchQuery)
  );

  return (
    <AppShell>
      <div className="min-h-screen bg-[var(--bg-primary)]">
        {/* Header */}
        <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] border-b border-[var(--border-subtle)]">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  返回首页
                </Link>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[var(--accent-primary)]" />
                  <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                    用户管理
                  </h1>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium"
              >
                <Plus className="mr-2 h-4 w-4" />
                新增用户
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-soft p-4 mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="搜索用户名或角色..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
              />
            </div>
          </div>

          {/* Users List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-[var(--accent-primary)] animate-spin" />
              <span className="ml-2 text-[var(--text-muted)]">加载中...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-soft">
              <Users className="h-12 w-12 text-[var(--border-subtle)] mb-4" />
              <p className="text-[var(--text-muted)]">暂无用户数据</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                    <th className="px-6 py-3 text-left font-medium text-[var(--text-secondary)]">
                      用户名
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-[var(--text-secondary)]">
                      角色
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-[var(--text-secondary)]">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-right font-medium text-[var(--text-secondary)]">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)]/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-[var(--text-primary)] font-medium">
                        <div className="flex items-center gap-2">
                          <UserCog className="h-4 w-4 text-[var(--text-muted)]" />
                          {user.username}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            roleBadgeColors[user.role] || "badge-soft-gray"
                          }`}
                        >
                          <Shield className="h-3 w-3" />
                          {roleLabels[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-muted)]">
                        {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="inline-flex items-center rounded-lg p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateForm({ username: "", password: "", role: "operator" });
        }}
        title="新增用户"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              用户名
            </label>
            <input
              type="text"
              value={createForm.username}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, username: e.target.value }))
              }
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              密码
            </label>
            <input
              type="password"
              value={createForm.password}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, password: e.target.value }))
              }
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              角色
            </label>
            <select
              value={createForm.role}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, role: e.target.value }))
              }
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
            >
              <option value="admin">系统管理员</option>
              <option value="productManager">产品经理</option>
              <option value="dataAnalyst">数据分析师</option>
              <option value="operator">运营专员</option>
              <option value="customerService">客服主管</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setCreateForm({ username: "", password: "", role: "operator" });
              }}
              className="rounded-xl border border-[var(--border-subtle)] bg-white px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCreate}
              className="btn-primary rounded-xl px-4 py-2 text-sm font-medium"
            >
              创建用户
            </button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
