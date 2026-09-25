export interface SetlistSong {
  id: number;
  songId: number;
  songTitle: string;
  songArtist: string;
  originalKey: string;
  performanceKey?: string;
  performanceBpm?: number;
  position: number;
  notes?: string;
  lyricsAndChords?: string;
}

export interface Setlist {
  id: number;
  name: string;
  eventDate?: string;
  venue?: string;
  description?: string;
  songs?: SetlistSong[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SetlistRequest {
  name: string;
  eventDate?: string;
  venue?: string;
  description?: string;
}

export interface SetlistSongRequest {
  songId: number;
  position?: number;
  performanceKey?: string;
  performanceBpm?: number;
  notes?: string;
}