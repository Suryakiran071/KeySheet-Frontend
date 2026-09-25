export interface Song {
  id: number;
  title: string;
  artist: string;
  originalKey: string;
  keyType?: string; // "Major" | "Minor"
  bpm?: number;
  genre?: string;
  duration?: string;       // e.g. "4:30"
  timeSignature?: string;  // e.g. "4/4", "3/4", "6/8"
  lyricsAndChords?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SongRequest {
  title: string;
  artist: string;
  originalKey?: string;
  keyType?: string; // "Major" | "Minor"
  bpm?: number;
  genre?: string;
  duration?: string;
  timeSignature?: string;
  lyricsAndChords?: string;
  notes?: string;
}
