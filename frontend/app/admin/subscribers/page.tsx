"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Mail,
  Search,
  Download,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  X,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Subscriber {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0 });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("24ghanta_admin_token")
      : null;

  const fetchSubscribers = useCallback(
    async (page = 1) => {
      if (!token) return;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "20");
        if (search) params.set("search", search);
        if (statusFilter) params.set("status", statusFilter);

        const res = await fetch(
          `${API}/api/admin/newsletter?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setSubscribers(data.data);
        setStats(data.stats);
        setPagination(data.pagination);
      } catch {
        console.error("Failed to load subscribers");
      } finally {
        setLoading(false);
      }
    },
    [token, search, statusFilter]
  );

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  async function handleToggle(id: number) {
    if (!token) return;
    try {
      const res = await fetch(
        `${API}/api/admin/newsletter/${id}/toggle`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSubscribers((prev) =>
        prev.map((s) => (s.id === id ? updated : s))
      );
      // Refresh stats
      setStats((prev) => {
        const wasActive = !updated.is_active;
        return {
          ...prev,
          active: prev.active + (wasActive ? -1 : 1),
          inactive: prev.inactive + (wasActive ? 1 : -1),
        };
      });
    } catch {
      alert("Failed to toggle subscriber status");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to permanently remove this subscriber?"))
      return;
    if (!token) return;
    try {
      const res = await fetch(
        `${API}/api/admin/newsletter/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error();
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      setStats((prev) => ({
        total: prev.total - 1,
        active:
          prev.active -
          (subscribers.find((s) => s.id === id)?.is_active ? 1 : 0),
        inactive:
          prev.inactive -
          (subscribers.find((s) => s.id === id)?.is_active ? 0 : 1),
      }));
    } catch {
      alert("Failed to delete subscriber");
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch(`${API}/api/admin/newsletter/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: newEmail }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to add");
      }
      setNewEmail("");
      setShowAddModal(false);
      fetchSubscribers(pagination.page);
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setAddLoading(false);
    }
  }

  function handleExport() {
    if (!token) return;
    window.open(
      `${API}/api/admin/newsletter/export?token=${token}`,
      "_blank"
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscribers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your newsletter subscribers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => {
              setShowAddModal(true);
              setNewEmail("");
              setAddError(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Subscriber
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Subscribers",
            value: stats.total,
            icon: Users,
            color: "blue",
            bg: "bg-blue-50",
            text: "text-blue-600",
          },
          {
            label: "Active",
            value: stats.active,
            icon: UserCheck,
            color: "green",
            bg: "bg-green-50",
            text: "text-green-600",
          },
          {
            label: "Inactive",
            value: stats.inactive,
            icon: UserX,
            color: "red",
            bg: "bg-red-50",
            text: "text-red-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4"
          >
            <div
              className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}
            >
              <stat.icon className={`w-6 h-6 ${stat.text}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchSubscribers(1)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "" | "active" | "inactive")
            }
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 bg-white"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={() => fetchSubscribers(1)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
          </div>
        ) : subscribers.length === 0 ? (
          <div className="text-center py-20">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No subscribers found</p>
            <p className="text-sm text-gray-400 mt-1">
              {search || statusFilter
                ? "Try adjusting your filters"
                : "Subscribers will appear here when people subscribe"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left font-semibold text-gray-600 px-5 py-3.5">
                      Email
                    </th>
                    <th className="text-left font-semibold text-gray-600 px-5 py-3.5">
                      Status
                    </th>
                    <th className="text-left font-semibold text-gray-600 px-5 py-3.5">
                      Subscribed At
                    </th>
                    <th className="text-right font-semibold text-gray-600 px-5 py-3.5">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-100 to-red-200 flex items-center justify-center text-red-700 font-bold text-xs shrink-0">
                            {sub.email.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">
                            {sub.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            sub.is_active
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              sub.is_active ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                          {sub.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {new Date(sub.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggle(sub.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              sub.is_active
                                ? "text-green-600 hover:bg-green-50"
                                : "text-gray-400 hover:bg-gray-100"
                            }`}
                            title={
                              sub.is_active ? "Deactivate" : "Activate"
                            }
                          >
                            {sub.is_active ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(sub.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-gray-50">
              {subscribers.map((sub) => (
                <div key={sub.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-red-100 to-red-200 flex items-center justify-center text-red-700 font-bold text-[10px] shrink-0">
                        {sub.email.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">{sub.email}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 ml-9">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sub.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {sub.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleToggle(sub.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                      {sub.is_active ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(sub.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchSubscribers(pagination.page - 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 px-2">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchSubscribers(pagination.page + 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Subscriber Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Mail className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Add Subscriber</h3>
                <p className="text-xs text-gray-500">
                  Manually add an email to the newsletter
                </p>
              </div>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="subscriber@example.com"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                />
              </div>
              {addError && (
                <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-lg">
                  {addError}
                </p>
              )}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {addLoading ? "Adding..." : "Add Subscriber"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
