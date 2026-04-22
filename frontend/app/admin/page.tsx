"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText, TrendingUp, BarChart3, Eye, Clock,
  ArrowUpRight, Plus, Newspaper, Activity, Video
} from "lucide-react";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);

  // Example stats since API isn't fully ready
  const stats = {
    totalArticles: 156,
    published: 142,
    drafts: 14,
    totalViews: 450230,
    totalVideos: 45,
    categories: 8,
  };

  const recentArticles = [
    { id: 1, title: "Major Political Development in Kathmandu", category: "Politics", status: "Published", time: "2h ago" },
    { id: 2, title: "New Economic Policy Announced", category: "Business", status: "Draft", time: "5h ago" },
    { id: 3, title: "Local Team Wins Championship", category: "Sports", status: "Published", time: "1d ago" },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back! Here&apos;s an overview of your portal.</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-all"
        >
          <Plus className="w-4 h-4" /> New Article
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/articles" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalArticles}</p>
          <p className="text-xs text-gray-500 mt-1">Total Articles</p>
          <div className="flex items-center gap-2 mt-2 text-[10px]">
            <span className="text-green-600 font-medium">{stats.published} published</span>
            <span className="text-gray-300">•</span>
            <span className="text-orange-600 font-medium">{stats.drafts} drafts</span>
          </div>
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Total Views</p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-green-600 font-medium">
            <TrendingUp className="w-3 h-3" /> Active readership
          </div>
        </div>

        <Link href="/admin/videos" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Video className="w-5 h-5 text-red-600" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalVideos}</p>
          <p className="text-xs text-gray-500 mt-1">Total Videos</p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-red-600 font-medium">
            Multimedia Content
          </div>
        </Link>

        <Link href="/admin/categories" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.categories}</p>
          <p className="text-xs text-gray-500 mt-1">Categories</p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-orange-600 font-medium">
            News Sections
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400" /> Quick Actions
          </h3>
          <div className="space-y-2">
            <Link href="/admin/articles/new" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <Plus className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Create Article</p>
                <p className="text-[10px] text-gray-500">Write a new news article</p>
              </div>
            </Link>
            <Link href="/admin/videos/new" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Video className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Add Video</p>
                <p className="text-[10px] text-gray-500">Embed a new video</p>
              </div>
            </Link>
            <Link href="/" target="_blank" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <Eye className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">View Live Site</p>
                <p className="text-[10px] text-gray-500">Open the public portal</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Articles */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-gray-400" /> Recent Articles
            </h3>
            <Link href="/admin/articles" className="text-xs text-red-600 font-medium hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {recentArticles.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 group cursor-pointer">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900 font-medium truncate group-hover:text-red-600 transition-colors">{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{item.category}</span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{item.time}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.status === 'Published' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
