"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart3,
  Plus,
  Trash2,
  RotateCcw,
  Edit3,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface PollOption {
  id: number;
  text: string;
  votes: number;
}

interface Poll {
  id: number;
  question: string;
  total_votes: number;
  ends_at: string | null;
  is_active: boolean;
  options: PollOption[];
}

export default function AdminPolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);

  // Form state
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [isActive, setIsActive] = useState(true);
  const [endsAt, setEndsAt] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("24ghanta_admin_token")
      : null;

  const fetchPolls = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/polls`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPolls(data.data || []);
    } catch {
      console.error("Failed to load polls");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  function resetForm() {
    setQuestion("");
    setOptions(["", ""]);
    setIsActive(true);
    setEndsAt("");
    setFormError(null);
    setEditingPoll(null);
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(poll: Poll) {
    setEditingPoll(poll);
    setQuestion(poll.question);
    setOptions(poll.options.map((o) => o.text));
    setIsActive(poll.is_active);
    setEndsAt(poll.ends_at ? poll.ends_at.slice(0, 16) : "");
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    const cleanOptions = options.filter((o) => o.trim());
    if (!question.trim()) {
      setFormError("Question is required");
      return;
    }
    if (cleanOptions.length < 2) {
      setFormError("At least 2 options are required");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const body = {
        question: question.trim(),
        options: cleanOptions,
        is_active: isActive,
        ends_at: endsAt || null,
      };

      const url = editingPoll
        ? `${API}/api/admin/polls/${editingPoll.id}`
        : `${API}/api/admin/polls`;
      const method = editingPoll ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to save poll");
      }

      setShowForm(false);
      resetForm();
      fetchPolls();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: number) {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/admin/polls/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      fetchPolls();
    } catch {
      alert("Failed to toggle poll status");
    }
  }

  async function handleReset(id: number) {
    if (!confirm("Reset all votes to zero for this poll?")) return;
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/admin/polls/${id}/reset`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      fetchPolls();
    } catch {
      alert("Failed to reset votes");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Permanently delete this poll?")) return;
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/admin/polls/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setPolls((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Failed to delete poll");
    }
  }

  function addOption() {
    setOptions([...options, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  }

  function updateOption(index: number, value: string) {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  }

  const formatVotes = (votes: number): string => {
    if (votes >= 1000) return `${(votes / 1000).toFixed(1)}k`;
    return votes.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Polls</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage quick polls for your audience
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-all"
        >
          <Plus className="w-4 h-4" /> New Poll
        </button>
      </div>

      {/* Poll List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
        </div>
      ) : polls.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-20">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No polls yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create your first poll to engage your audience
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {polls.map((poll) => (
            <div
              key={poll.id}
              className={`bg-white rounded-2xl border p-5 transition-all ${
                poll.is_active
                  ? "border-green-200 shadow-sm shadow-green-100"
                  : "border-gray-100"
              }`}
            >
              {/* Poll Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                        poll.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          poll.is_active ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      {poll.is_active ? "Active" : "Inactive"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatVotes(poll.total_votes)} votes
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug">
                    {poll.question}
                  </h3>
                </div>
              </div>

              {/* Options with vote bars */}
              <div className="space-y-1.5 mb-4">
                {poll.options.map((opt) => {
                  const pct =
                    poll.total_votes > 0
                      ? Math.round((opt.votes / poll.total_votes) * 100)
                      : 0;
                  return (
                    <div key={opt.id} className="relative overflow-hidden rounded-lg">
                      <div
                        className="absolute inset-y-0 left-0 bg-blue-50 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative flex items-center justify-between px-3 py-2 border border-gray-100 rounded-lg">
                        <span className="text-xs text-gray-700">
                          {opt.text}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-gray-400">
                            {opt.votes}
                          </span>
                          <span className="text-xs font-semibold text-gray-600 w-8 text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 border-t border-gray-50 pt-3">
                <div className="px-2 py-1" title={poll.is_active ? "Deactivate" : "Activate"}>
                  <ToggleSwitch checked={poll.is_active} onChange={() => handleToggle(poll.id)} />
                </div>
                <button
                  onClick={() => openEdit(poll)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleReset(poll.id)}
                  className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Reset votes"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => handleDelete(poll.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {editingPoll ? "Edit Poll" : "Create New Poll"}
                </h3>
                <p className="text-xs text-gray-500">
                  {editingPoll
                    ? "Update the poll question and options"
                    : "Ask your audience a question"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Question */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Question
                </label>
                <input
                  type="text"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., Best local food destination?"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                />
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Options
                </label>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-5 text-center shrink-0">
                        {i + 1}.
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(i)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="mt-2 text-xs text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add option
                  </button>
                )}
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Set as active poll
                  </p>
                  <p className="text-xs text-gray-400">
                    Only one poll can be active at a time
                  </p>
                </div>
                <ToggleSwitch checked={isActive} onChange={() => setIsActive(!isActive)} />
              </div>

              {/* End date (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  End date{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              {editingPoll && (
                <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Updating options will reset all existing votes to zero.
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {editingPoll ? "Update Poll" : "Create Poll"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
