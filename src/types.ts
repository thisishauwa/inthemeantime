export type PaperStyle = 'pink' | 'brown' | 'notebook' | 'a4';

export type PhotoFrameStyle = 'polaroid' | 'vintage' | 'snapshot' | 'cabinet';

export interface PlacedSticker {
  id: string;
  type: 'sticker' | 'emoji';
  content: string; // Image URL or Emoji string or SVG
  name: string;
  x: number; // percentage from left (0 to 100)
  y: number; // percentage from top (0 to 100)
  rotate: number; // degrees
  scale?: number;
}

export interface PlacedPhoto {
  id: string;
  url: string;
  frame: PhotoFrameStyle;
  caption?: string;
  x: number;
  y: number;
  rotate: number;
}

export interface Attachment {
  id: string;
  entry_id: string;
  type: 'image' | 'audio';
  file_url: string;
  filename: string;
  mime_type?: string;
  duration?: number;
  caption?: string;
  created_at: string;
}

export interface Entry {
  id: string;
  user_id?: string;
  title?: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  entry_date: string;
  for_you: boolean; // Flagged for the curated collection for the future person
  is_favorite?: boolean;
  status?: 'draft' | 'instant' | 'scheduled' | 'sent';
  tags: string[];
  attachments: Attachment[];
  
  // Posthearts Canvas Styles
  paper_style?: PaperStyle;
  backdrop_color?: string;
  font_family?: string;
  font_size?: number;
  text_align?: 'left' | 'center' | 'right';
  stickers?: PlacedSticker[];
  photos?: PlacedPhoto[];
}

export interface FilterState {
  searchQuery: string;
  onlyForYou: boolean;
  selectedTag: string | null;
  mediaType: 'all' | 'image' | 'audio';
  dateSort: 'desc' | 'asc';
  yearMonth?: string | null;
}

export interface AppSettings {
  userName?: string;
  partnerSalutation?: string;
  theme: 'paper' | 'night' | 'sepia';
  passcodeEnabled: boolean;
  passcode?: string;
  passcodeHash?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}
