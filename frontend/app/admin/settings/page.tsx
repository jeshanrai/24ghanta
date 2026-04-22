"use client";
import { useState } from "react";
import { Lock, Check } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
function getToken() { return localStorage.getItem("24ghanta_admin_token") || ""; }

export default function SettingsPage() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (newPw !== confirmPw) { setError("New passwords do not match"); return; }
    if (newPw.length < 6) { setError("Password must be at least 6 characters"); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/admin/change-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setSuccess("Password changed successfully!");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (e: any) { setError(e.message || "Failed to change password"); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Settings</h1><p className="text-sm text-gray-500 mt-1">Manage your admin account</p></div>

      <div className="max-w-xl">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><Lock className="w-5 h-5 text-red-600" /></div>
            <div><h2 className="text-lg font-semibold text-gray-900">Change Password</h2><p className="text-xs text-gray-500">Update your admin password</p></div>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-2"><Check className="w-4 h-4" />{success}</div>}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Current Password</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">New Password</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Confirm New Password</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" /></div>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 mt-2">
              {saving ? "Saving..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
