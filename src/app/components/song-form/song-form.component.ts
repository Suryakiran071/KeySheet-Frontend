import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SongRequest } from '../../Models/song.model';
import { SongService } from '../../services/song.service';

@Component({
  selector: 'app-song-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './song-form.component.html',
})
export class SongFormComponent implements OnInit {
  isEditMode: boolean = false;
  songId?: number;
  isLoading: boolean = false;

  song: SongRequest = {
    title: '',
    artist: '',
    originalKey: 'C',
    keyType: 'Major',
    bpm: 90,
    genre: 'Bollywood',
    duration: '',
    timeSignature: '4/4',
    lyricsAndChords: '',
    notes: ''
  };

  keys: string[] = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  keyTypes: string[] = ['Major', 'Minor'];
  timeSignatures: string[] = ['4/4', '3/4', '6/8', '2/4', '5/4', '7/8'];
  genres: string[] = ['Bollywood', 'Pop', 'Rock', 'Acoustic', 'Jazz', 'Classical', 'Worship', 'Other'];

  constructor(
    private songService: SongService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.songId = Number(idParam);
      this.loadSong(this.songId);
    }
  }

  loadSong(id: number): void {
    this.isLoading = true;
    this.songService.getSongById(id).subscribe({
      next: (data) => {
        this.song = {
          title: data.title,
          artist: data.artist,
          originalKey: data.originalKey,
          keyType: data.keyType || 'Major',
          bpm: data.bpm,
          genre: data.genre,
          duration: data.duration || '',
          timeSignature: data.timeSignature || '4/4',
          lyricsAndChords: data.lyricsAndChords,
          notes: data.notes
        };
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading song for edit', err);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (!this.song.title || !this.song.artist) {
      alert('Title and Artist are required!');
      return;
    }

    this.isLoading = true;

    if (this.isEditMode && this.songId) {
      this.songService.updateSong(this.songId, this.song).subscribe({
        next: (updated) => {
          this.router.navigate(['/songs', updated.id]);
        },
        error: (err) => {
          console.error('Error updating song', err);
          this.isLoading = false;
        }
      });
    } else {
      this.songService.createSong(this.song).subscribe({
        next: (created) => {
          this.router.navigate(['/songs', created.id]);
        },
        error: (err) => {
          console.error('Error creating song', err);
          this.isLoading = false;
        }
      });
    }
  }

  private sectionColors: Record<string, string> = {
    'intro':      'bg-violet-950 text-violet-300 border-violet-700/60',
    'verse':      'bg-sky-950 text-sky-300 border-sky-700/60',
    'prechorus':  'bg-amber-950 text-amber-300 border-amber-700/60',
    'pre-chorus': 'bg-amber-950 text-amber-300 border-amber-700/60',
    'chorus':     'bg-emerald-950 text-emerald-300 border-emerald-700/60',
    'bridge':     'bg-rose-950 text-rose-300 border-rose-700/60',
    'outro':      'bg-slate-800 text-slate-300 border-slate-600/60',
    'interlude':  'bg-purple-950 text-purple-300 border-purple-700/60',
    'solo':       'bg-orange-950 text-orange-300 border-orange-700/60',
  };

  // Parses ChordPro "[G]Lyrics" and "# Section | Tone" into styled HTML
  formatPreview(text?: string): string {
    if (!text) return '<span class="text-slate-500 italic">Live preview will appear here...</span>';

    const lines = text.split('\n');
    const result: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check if it's a section header (# Intro, # Chorus | Warm Pad, etc.)
      if (trimmed.startsWith('#')) {
        const raw = trimmed.replace(/^#+\s*/, '');
        const pipeIndex = raw.indexOf('|');
        let label = raw;
        let tone = '';
        if (pipeIndex >= 0) {
          label = raw.substring(0, pipeIndex).trim();
          tone = raw.substring(pipeIndex + 1).trim();
        }
        const key = label.toLowerCase().replace(/\s+\d+$/, '').replace(/[\s-]/g, '');
        const colorClass = this.sectionColors[key] || 'bg-slate-800 text-slate-300 border-slate-600/60';
        const toneHtml = tone
          ? `<span class="ml-2 text-xs font-medium text-amber-400/80 italic">🎹 ${tone}</span>`
          : '';

        // Remove any blank gap spacer directly preceding this section header
        while (result.length > 0 && result[result.length - 1] === '<div class="h-3"></div>') {
          result.pop();
        }

        const topMargin = result.length === 0 ? 'mt-0' : 'mt-4';
        result.push(`<div class="${topMargin} mb-1.5 flex items-center flex-wrap gap-1"><span class="inline-block font-bold text-xs uppercase tracking-widest px-3 py-0.5 rounded-md border ${colorClass}">◆ ${label}</span>${toneHtml}</div>`);

        // Skip any blank lines immediately following the section header
        while (i + 1 < lines.length && !lines[i + 1].trim()) {
          i++;
        }
        continue;
      }

      // If it's a blank line
      if (!trimmed) {
        // Add at most one compact gap spacer between stanzas
        if (result.length > 0 && result[result.length - 1] !== '<div class="h-3"></div>') {
          result.push('<div class="h-3"></div>');
        }
        continue;
      }

      // Normal line with chords
      const formattedLine = line.replace(
        /\[([^\]]+)\]/g,
        '<span class="inline-block font-bold text-sky-400 bg-sky-950/80 border border-sky-800/40 rounded px-1.5 py-0.5 text-xs mx-0.5 transform -translate-y-1">$1</span>'
      );
      result.push(`<div class="leading-relaxed whitespace-pre-wrap">${formattedLine}</div>`);
    }

    return result.join('');
  }
}