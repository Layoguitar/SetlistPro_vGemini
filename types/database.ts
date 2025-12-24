export interface Song {
  id: string;
  user_id: string;
  title: string;
  artist: string | null;
  bpm: number;
  time_signature: string;
  default_key: string | null;
  duration_seconds: number;
  created_at: string;
}

export interface SetlistItem {
  id: string;
  setlist_id: string;
  song_id: string | null;
  type: 'song' | 'block';
  position: number;
  title_override: string | null; 
  key_override: string | null;
  duration_override: number | null;
  note: string | null;
  song?: Song;
}

export interface Song {
  id: string;
  user_id: string; // Puede ser string | null si lo cambiaste antes
  title: string;
  artist: string | null;
  bpm: number;
  time_signature: string;
  default_key: string | null;
  duration_seconds: number;
  content?: string | null; // <--- ¡AGREGA ESTA LÍNEA! (Letra/Acordes)
  created_at: string;
}

// ... (Lo demás igual)