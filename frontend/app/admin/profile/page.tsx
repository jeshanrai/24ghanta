"use client";

import { useEffect, useState, useRef } from "react";
import { UserPen, Loader2, Save, Mail, CheckCircle2, Image as ImageIcon, Trash2, UploadCloud } from "lucide-react";
import Image from "next/image";

export default function AuthorProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form fields
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  // Read-only fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("24ghanta_admin_token");
      if (!token) return;

      try {
        const res = await fetch(`${API}/api/admin/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setAvatarUrl(data.avatar_url || "");
          setUsername(data.username || "");
          setEmail(data.email || "");
          setRole(data.role || "");
        } else {
          setError("Failed to load profile data.");
        }
      } catch (err) {
        console.error(err);
        setError("Network error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [API]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem("24ghanta_admin_token");
    if (!token) return;

    setUploadingAvatar(true);
    setError("");
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API}/api/admin/media`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        setError(`Failed to upload avatar: ${err.error || 'Unknown error'}`);
      } else {
        const data = await res.json();
        if (data.media?.storage_key) {
          setAvatarUrl(`/uploads/${data.media.storage_key}`);
        }
      }
    } catch (err) {
      console.error("Avatar upload error", err);
      setError("Failed to upload avatar due to network error.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    const token = localStorage.getItem("24ghanta_admin_token");
    if (!token) return;

    setSaving(true);
    
    try {
      const res = await fetch(`${API}/api/admin/profile`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          name: name.trim(), 
          avatar_url: avatarUrl.trim() 
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess("Profile updated successfully!");
        setName(data.name || ""); // update from server response
        setAvatarUrl(data.avatar_url || "");
        // Also update the local storage in case the name is shown elsewhere
        if (data.name) {
          localStorage.setItem("24ghanta_admin_name", data.name);
        }
      } else {
        setError(data.error || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <UserPen className="w-8 h-8 text-red-600" />
          My Profile
        </h1>
        <p className="text-sm text-gray-500 mt-2">Update your personal author information.</p>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center pb-6 border-b border-gray-100">
            <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center relative group">
              {avatarUrl ? (
                <img 
                  src={avatarUrl.startsWith('http') ? avatarUrl : `${API}${avatarUrl}`} 
                  alt="Profile Avatar" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback on broken image link
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="0" y="0" width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" font-family="Arial" font-size="12" fill="%239ca3af" text-anchor="middle" dy=".3em">No Image</text></svg>';
                  }}
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>
            
            <div className="flex-1 space-y-3 w-full sm:w-auto">
              <label className="text-sm font-semibold text-gray-700 block">
                Avatar
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  accept="image/jpeg,image/png,image/webp,image/gif" 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-xl flex items-center justify-center gap-2 transition-colors border border-gray-200 shadow-sm whitespace-nowrap disabled:opacity-50"
                >
                  {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  {uploadingAvatar ? "Uploading..." : (avatarUrl ? "Change Avatar" : "Upload Avatar")}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl("")}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">Upload an image from your computer to display on your profile.</p>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 block">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full sm:max-w-md px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
              placeholder="e.g. John Doe"
              required
            />
            <p className="text-xs text-gray-500">This name will be publicly visible on your published articles and videos.</p>
          </div>

          <hr className="border-gray-100" />

          {/* Read-Only Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Account Details (Read-only)</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Username
                </label>
                <div className="px-4 py-2.5 bg-gray-100/50 border border-gray-100 rounded-xl text-gray-600 font-mono text-sm">
                  @{username || "N/A"}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Email
                </label>
                <div className="px-4 py-2.5 bg-gray-100/50 border border-gray-100 rounded-xl text-gray-600 text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {email || "N/A"}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Role
                </label>
                <div className="px-4 py-2.5 bg-gray-100/50 border border-gray-100 rounded-xl text-gray-600 text-sm capitalize">
                  {role}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-red-700"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}