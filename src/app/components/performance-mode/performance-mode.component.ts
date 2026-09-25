import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Setlist, SetlistSong } from '../../Models/setlist.model';
import { SetlistService } from '../../services/setlist.service';
import { SongService } from '../../services/song.service';

@Component({
  selector: 'app-performance-mode',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './performance-mode.component.html',
})
export class PerformanceModeComponent implements OnInit, OnDestroy {
  setlist?: Setlist;
  currentIndex: number = 0;
  isLoading: boolean = true;
  showSongDrawer: boolean = false;

  // Auto-scroll state
  isScrolling: boolean = false;
  scrollSpeed: number = 50; // 1-100 range
  private scrollInterval: any = null;

  // Font size state
  fontSize: number = 20;

  // Fullscreen state
  isFullscreen: boolean = false;

  constructor(
    private setlistService: SetlistService,
    private songService: SongService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadSetlist(Number(idParam));
    }
  }

  ngOnDestroy(): void {
    this.stopAutoScroll();
  }

  loadSetlist(id: number): void {
    this.isLoading = true;
    this.setlistService.getSetlistById(id).subscribe({
      next: (data) => {
        this.setlist = data;
        this.currentIndex = 0;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading setlist for stage mode', err);
        this.isLoading = false;
      }
    });
  }

  get currentSong(): SetlistSong | undefined {
    if (!this.setlist || !this.setlist.songs || this.setlist.songs.length === 0) return undefined;
    return this.setlist.songs[this.currentIndex];
  }

  nextSong(): void {
    if (this.setlist && this.setlist.songs && this.currentIndex < this.setlist.songs.length - 1) {
      this.stopAutoScroll();
      this.currentIndex++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousSong(): void {
    if (this.currentIndex > 0) {
      this.stopAutoScroll();
      this.currentIndex--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  jumpToSong(index: number): void {
    this.stopAutoScroll();
    this.currentIndex = index;
    this.showSongDrawer = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Keyboard and Bluetooth Foot-Pedal support!
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowRight' || event.key === 'PageDown') {
      this.nextSong();
    } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      this.previousSong();
    } else if (event.key === ' ') {
      // Spacebar toggles auto-scroll
      event.preventDefault();
      this.toggleAutoScroll();
    }
  }

  // Live on-stage semitone shift
  shiftStageSemitones(delta: number): void {
    const song = this.currentSong;
    if (!song) return;

    this.songService.transposeSong(song.songId, undefined, delta).subscribe({
      next: (transposed) => {
        song.lyricsAndChords = transposed.lyricsAndChords;
        song.performanceKey = transposed.originalKey;
      },
      error: (err) => console.error('Error adjusting key in stage mode', err)
    });
  }

  // ── Auto-Scroll ────────────────────────────────────────────────────────────
  toggleAutoScroll(): void {
    if (this.isScrolling) {
      this.stopAutoScroll();
    } else {
      this.startAutoScroll();
    }
  }

  private startAutoScroll(): void {
    this.isScrolling = true;
    const intervalMs = this.getScrollIntervalMs();
    this.scrollInterval = setInterval(() => {
      window.scrollBy({ top: 1, behavior: 'auto' });
    }, intervalMs);
  }

  private stopAutoScroll(): void {
    this.isScrolling = false;
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }
  }

  onScrollSpeedChange(): void {
    if (this.isScrolling) {
      // Restart with new speed
      this.stopAutoScroll();
      this.startAutoScroll();
    }
  }

  private getScrollIntervalMs(): number {
    // scrollSpeed 1 = very slow (100ms per px), 100 = very fast (10ms per px)
    return Math.max(10, 110 - this.scrollSpeed);
  }

  // ── Font Size Control ──────────────────────────────────────────────────────
  increaseFontSize(): void {
    if (this.fontSize < 40) this.fontSize += 2;
  }

  decreaseFontSize(): void {
    if (this.fontSize > 12) this.fontSize -= 2;
  }

  // ── Fullscreen Toggle ──────────────────────────────────────────────────────
  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        this.isFullscreen = true;
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        this.isFullscreen = false;
      }).catch(() => {});
    }
  }

  // Large, high-visibility stage chord rendering with section + tone support
  formatStageChords(text?: string): string {
    if (!text) return '<span class="text-slate-600 italic">No chords entered for this song.</span>';

    const lines = text.split('\n');
    const result: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Section header with optional tone: # Verse 1 | Grand Piano
      if (trimmed.startsWith('#')) {
        const raw = trimmed.replace(/^#+\s*/, '');
        const pipeIndex = raw.indexOf('|');
        let label = raw;
        let tone = '';
        if (pipeIndex >= 0) {
          label = raw.substring(0, pipeIndex).trim();
          tone = raw.substring(pipeIndex + 1).trim();
        }
        const toneHtml = tone
          ? `<span class="ml-3 text-base font-semibold text-amber-400 bg-amber-950/60 border border-amber-600/40 rounded-lg px-3 py-1 italic">🎹 ${tone}</span>`
          : '';

        // Remove any gap spacer immediately preceding this section
        while (result.length > 0 && result[result.length - 1] === '<div class="h-4"></div>') {
          result.pop();
        }

        const topMargin = result.length === 0 ? 'mt-2' : 'mt-8';
        result.push(`<div class="${topMargin} mb-3 flex items-center flex-wrap gap-2"><span class="font-black text-lg uppercase tracking-widest text-emerald-400 border-b-2 border-emerald-500/40 pb-1">◆ ${label}</span>${toneHtml}</div>`);

        // Skip blank lines immediately following the section header
        while (i + 1 < lines.length && !lines[i + 1].trim()) {
          i++;
        }
        continue;
      }

      // Empty line
      if (!trimmed) {
        if (result.length > 0 && result[result.length - 1] !== '<div class="h-4"></div>') {
          result.push('<div class="h-4"></div>');
        }
        continue;
      }

      // Chord line
      const renderedLine = line.replace(
        /\[([^\]]+)\]/g,
        '<span class="inline-block font-black text-sky-300 bg-sky-950/90 border border-sky-500/50 rounded-lg px-2 py-0.5 text-base mx-1 transform -translate-y-2 shadow-md shadow-sky-500/20">$1</span>'
      );
      result.push(`<div>${renderedLine}</div>`);
    }

    return result.join('');
  }
}