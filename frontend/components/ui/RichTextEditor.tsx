"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Strikethrough, List, ListOrdered, Quote, Heading2, Heading3,
  Link as LinkIcon, Image as ImageIcon, Film as YoutubeIcon,
  MessageSquareQuote, AtSign as TweetIcon, Undo2, Redo2, Loader2, Code,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write the story…",
  minHeight = "min-h-[420px]",
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        blockquote: { HTMLAttributes: { class: "tiptap-blockquote" } },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: { class: "tiptap-image" },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        HTMLAttributes: { class: "tiptap-youtube" },
        width: 720,
        height: 405,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "tiptap-content prose prose-sm sm:prose-base max-w-none focus:outline-none px-4 py-4",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sync external value changes (e.g., loading existing article into form)
  useEffect(() => {
    if (!editor) return;
    if (value && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor) return;
      const isWebp =
        file.type === "image/webp" || file.name.toLowerCase().endsWith(".webp");
      if (!isWebp) {
        alert("Only .webp images can be uploaded.");
        return;
      }
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("24ghanta_admin_token")
          : null;
      if (!token) {
        alert("Sign in again to upload.");
        return;
      }
      const fd = new FormData();
      fd.append("file", file);
      setUploading(true);
      try {
        const res = await fetch(`${API}/api/uploads/image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Upload failed");
        const url = json.data.url.startsWith("/")
          ? `${API}${json.data.url}`
          : json.data.url;
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [editor]
  );

  const insertYoutube = useCallback(() => {
    if (!editor) return;
    const url = prompt("Paste YouTube URL:");
    if (!url) return;
    editor.chain().focus().setYoutubeVideo({ src: url }).run();
  }, [editor]);

  const insertTweet = useCallback(() => {
    if (!editor) return;
    const url = prompt("Paste tweet/X status URL:");
    if (!url) return;
    const m = url.match(/^https?:\/\/(?:twitter|x)\.com\/[^/]+\/status\/(\d+)/i);
    if (!m) {
      alert("That doesn’t look like a tweet URL.");
      return;
    }
    // Render-side hydration is handled by /article/[slug] which loads the
    // Twitter widget script when it sees a .twitter-tweet element.
    const html = `<blockquote class="twitter-tweet" data-dnt="true"><a href="${url}">${url}</a></blockquote>`;
    editor.chain().focus().insertContent(html).run();
  }, [editor]);

  const insertLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = prompt("Link URL:", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const insertPullQuote = useCallback(() => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent(
        `<blockquote class="pull-quote"><p>“Pull quote — replace with your highlight.”</p></blockquote>`
      )
      .run();
  }, [editor]);

  if (!editor) {
    return (
      <div className={`border border-gray-200 rounded-xl ${minHeight} bg-gray-50`} />
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-300">
      <Toolbar
        editor={editor}
        uploading={uploading}
        onImage={() => fileInputRef.current?.click()}
        onYoutube={insertYoutube}
        onTweet={insertTweet}
        onLink={insertLink}
        onPullQuote={insertPullQuote}
      />
      <div className={minHeight}>
        <EditorContent editor={editor} />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/webp,.webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImageUpload(f);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}

function Toolbar({
  editor, uploading, onImage, onYoutube, onTweet, onLink, onPullQuote,
}: {
  editor: Editor;
  uploading: boolean;
  onImage: () => void;
  onYoutube: () => void;
  onTweet: () => void;
  onLink: () => void;
  onPullQuote: () => void;
}) {
  const Btn = ({
    onClick, active, disabled, title, children,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-md text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? "bg-red-50 text-red-600"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );

  const Sep = () => <span className="w-px h-5 bg-gray-200 mx-0.5" />;

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/60 sticky top-0 z-10">
      <Btn title="Bold (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
        <Bold className="w-4 h-4" />
      </Btn>
      <Btn title="Italic (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
        <Italic className="w-4 h-4" />
      </Btn>
      <Btn title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}>
        <Strikethrough className="w-4 h-4" />
      </Btn>
      <Btn title="Inline code" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")}>
        <Code className="w-4 h-4" />
      </Btn>
      <Sep />
      <Btn title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>
        <Heading2 className="w-4 h-4" />
      </Btn>
      <Btn title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}>
        <Heading3 className="w-4 h-4" />
      </Btn>
      <Btn title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
        <List className="w-4 h-4" />
      </Btn>
      <Btn title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
        <ListOrdered className="w-4 h-4" />
      </Btn>
      <Btn title="Block quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>
        <Quote className="w-4 h-4" />
      </Btn>
      <Btn title="Pull quote" onClick={onPullQuote}>
        <MessageSquareQuote className="w-4 h-4" />
      </Btn>
      <Sep />
      <Btn title="Insert link" onClick={onLink} active={editor.isActive("link")}>
        <LinkIcon className="w-4 h-4" />
      </Btn>
      <Btn title="Upload image (.webp)" onClick={onImage} disabled={uploading}>
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
      </Btn>
      <Btn title="Embed YouTube" onClick={onYoutube}>
        <YoutubeIcon className="w-4 h-4" />
      </Btn>
      <Btn title="Embed tweet" onClick={onTweet}>
        <TweetIcon className="w-4 h-4" />
      </Btn>
      <Sep />
      <Btn title="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo2 className="w-4 h-4" />
      </Btn>
      <Btn title="Redo (Ctrl+Shift+Z)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo2 className="w-4 h-4" />
      </Btn>
    </div>
  );
}
