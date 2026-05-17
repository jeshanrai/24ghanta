export interface MediaItem {
  id: string;
  storage_key: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  width: number;
  height: number;
  checksum?: string;
  alt_text: string | null;
  caption?: string | null;
  created_at: string;
}
