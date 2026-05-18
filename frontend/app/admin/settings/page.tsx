"use client";
import { useEffect, useState } from "react";
import { Lock, Check, UserPen } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
function getToken() { return localStorage.getItem("24ghanta_admin_token") || ""; }

export default function SettingsPage() {
  // ── Display name (profile) ──
  const [displayName, setDisplayName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // ── Password ──
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  // Hydrate from server so the input reflects what's actually stored.
  useEffect(() => {
    fetch(`${API}/api/admin/me`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (!me) return;
        setDisplayName(me.display_name || me.username || "");
      })
      .catch(() => {});
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    if (!displayName.trim()) { setProfileError("Display name is required"); return; }
    setProfileSaving(true);
    try {
      const res = await fetch(`${API}/api/admin/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ display_name: displayName.trim() }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const data = await res.json();
      // Push the new name into localStorage so the header + tab title update
      // immediately AND any other tabs receive the `storage` event we listen
      // for in the admin layout.
      localStorage.setItem("24ghanta_admin_display_name", data.display_name || displayName.trim());
      setProfileSuccess("Display name updated.");
    } catch (e: any) {
      setProfileError(e.message || "Failed to save display name");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(""); setPwSuccess("");
    if (newPw !== confirmPw) { setPwError("New passwords do not match"); return; }
    if (newPw.length < 6) { setPwError("Password must be at least 6 characters"); return; }
    setPwSaving(true);
    try {
      const res = await fetch(`${API}/api/admin/change-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setPwSuccess("Password changed successfully!");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (e: any) {
      setPwError(e.message || "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your admin account</p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Profile / display name */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <UserPen className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
              <p className="text-xs text-gray-500">
                This name appears in the CMS header, the browser tab, and as the byline on articles you publish.
              </p>
            </div>
          </div>

          {profileError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-2">
              <Check className="w-4 h-4" />
              {profileSuccess}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={120}
                placeholder="Your name as it should appear publicly"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
            <button
              type="submit"
              disabled={profileSaving}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 mt-2"
            >
              {profileSaving ? "Saving..." : "Save Display Name"}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><Lock className="w-5 h-5 text-red-600" /></div>
            <div><h2 className="text-lg font-semibold text-gray-900">Change Password</h2><p className="text-xs text-gray-500">Update your admin password</p></div>
          </div>

          {pwError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{pwError}</div>}
          {pwSuccess && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-2"><Check className="w-4 h-4" />{pwSuccess}</div>}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Current Password</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">New Password</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Confirm New Password</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" /></div>
            <button type="submit" disabled={pwSaving} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 mt-2">
              {pwSaving ? "Saving..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
