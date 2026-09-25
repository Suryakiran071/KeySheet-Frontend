import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Song } from '../../Models/song.model';
import { SongService } from '../../services/song.service';

@Component({
  selector: 'app-song-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './song-detail.component.html',
})
export class SongDetailComponent implements OnInit {
  song?: Song;
  isLoading: boolean = true;
  currentKey: string = '';
  semitonesOffset: number = 0;
  viewMode: 'lyrics' | 'chart' = 'lyrics';
  fontSize: number = 16;
  isFullscreen: boolean = false;

  keys: string[] = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

  constructor(
    private songService: SongService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadSong(Number(idParam));
    }
  }

  loadSong(id: number): void {
    this.isLoading = true;
    this.songService.getSongById(id).subscribe({
      next: (data) => {
        this.song = data;
        this.currentKey = data.originalKey;
        this.semitonesOffset = 0;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading song', err);
        this.isLoading = false;
      }
    });
  }

  onKeyChange(targetKey: string): void {
    if (!this.song) return;
    this.currentKey = targetKey;
    this.songService.transposeSong(this.song.id, targetKey).subscribe({
      next: (transposed) => {
        if (this.song) this.song.lyricsAndChords = transposed.lyricsAndChords;
      },
      error: (err) => console.error('Error transposing song', err)
    });
  }

  shiftSemitones(delta: number): void {
    if (!this.song) return;
    this.semitonesOffset += delta;
    this.songService.transposeSong(this.song.id, undefined, this.semitonesOffset).subscribe({
      next: (transposed) => {
        if (this.song) {
          this.song.lyricsAndChords = transposed.lyricsAndChords;
          this.currentKey = transposed.originalKey;
        }
      },
      error: (err) => console.error('Error shifting semitones', err)
    });
  }

  resetTranspose(): void {
    if (!this.song) return;
    this.loadSong(this.song.id);
  }

  // ── Font Size Control ──────────────────────────────────────────────────────
  increaseFontSize(): void {
    if (this.fontSize < 32) this.fontSize += 2;
  }

  decreaseFontSize(): void {
    if (this.fontSize > 10) this.fontSize -= 2;
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

  // ── Section Header Parser ──────────────────────────────────────────────────
  // Parses "# Verse 1 | Grand Piano" into { label: "Verse 1", tone: "Grand Piano" }
  private parseSectionHeader(line: string): { label: string; tone: string } {
    const raw = line.trim().replace(/^#+\s*/, '');
    const pipeIndex = raw.indexOf('|');
    if (pipeIndex >= 0) {
      return {
        label: raw.substring(0, pipeIndex).trim(),
        tone: raw.substring(pipeIndex + 1).trim(),
      };
    }
    return { label: raw, tone: '' };
  }

  // ── PDF Export ────────────────────────────────────────────────────────────
  exportPDF(): void {
    if (!this.song) return;

    const title = this.song.title || 'Untitled Song';
    const artist = this.song.artist || '';
    const key = (this.currentKey || this.song.originalKey || '') + (this.song.keyType ? ` ${this.song.keyType}` : '');
    const bpm = this.song.bpm ? `${this.song.bpm} BPM` : '';
    const genre = this.song.genre || '';
    const notes = this.song.notes ? `🎹 Sound Setup: ${this.song.notes}` : '';

    let contentHtml = '';
    if (this.viewMode === 'chart') {
      contentHtml = `<div class="chart-content">${this.generateChordChartForPrint()}</div>`;
    } else {
      contentHtml = `<div class="sheet-content">${this.formatChordSheetForPrint(this.song.lyricsAndChords)}</div>`;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      alert('Please allow popups in your browser to export the PDF.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title} - ${artist}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 14mm 16mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              background-color: #ffffff !important;
              color: #111111 !important;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header {
              margin-bottom: 12px;
            }
            .title {
              font-size: 24px;
              font-weight: 900;
              margin: 0 0 4px 0;
              color: #000000;
              line-height: 1.2;
            }
            .artist {
              font-size: 15px;
              color: #444444;
              margin: 0 0 8px 0;
              font-weight: 600;
            }
            .meta {
              font-size: 12px;
              color: #555555;
              margin-bottom: 6px;
            }
            .meta-bold {
              font-weight: bold;
              color: #111111;
            }
            .notes-box {
              font-size: 11px;
              color: #333333;
              background-color: #f3f4f6;
              border-left: 3px solid #6b7280;
              padding: 5px 10px;
              margin-top: 6px;
              border-radius: 2px;
            }
            .divider {
              border: none;
              border-top: 1.5px solid #d1d5db;
              margin: 10px 0 16px 0;
            }
            /* Lyrics & Chords Styles */
            .pc-section {
              font-size: 12px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              color: #000000;
              margin-top: 14px;
              margin-bottom: 4px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 2px;
              display: flex;
              align-items: baseline;
              gap: 10px;
            }
            .pc-tone {
              font-size: 10px;
              font-weight: 600;
              text-transform: none;
              letter-spacing: 0;
              color: #666666;
              font-style: italic;
            }
            .pc-chord-row {
              font-size: 13px;
              font-weight: 800;
              color: #000000;
              white-space: pre;
              line-height: 1.1;
            }
            .pc-lyric-row {
              font-size: 13px;
              color: #222222;
              white-space: pre;
              line-height: 1.3;
              margin-bottom: 3px;
            }
            .pc-plain {
              font-size: 13px;
              color: #333333;
              white-space: pre;
              line-height: 1.3;
              margin-bottom: 3px;
            }
            .pc-gap {
              height: 10px;
              display: block;
            }
            /* Chord Chart Print Styles */
            .chart-row {
              display: flex;
              align-items: baseline;
              font-size: 13px;
              margin-bottom: 5px;
              line-height: 1.4;
            }
            .chart-label {
              width: 120px;
              font-weight: 900;
              font-size: 11px;
              text-transform: uppercase;
              text-align: right;
              padding-right: 14px;
              color: #111111;
              flex-shrink: 0;
            }
            .chart-tone {
              font-size: 9px;
              font-weight: 600;
              color: #666666;
              font-style: italic;
              text-transform: none;
            }
            .chart-bars {
              font-weight: 800;
              color: #000000;
              white-space: nowrap;
            }
            .chart-cell {
              display: inline-block;
              width: 44px;
              text-align: left;
            }
            .chart-repeat {
              color: #6b7280;
            }
            .chart-pipe {
              color: #9ca3af;
              margin: 0 1px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${title}</div>
            <div class="artist">${artist}</div>
            <div class="meta">
              ${key ? `<span>Key: <span class="meta-bold">${key}</span></span>` : ''}
              ${bpm ? `<span> &nbsp;|&nbsp; <span class="meta-bold">${bpm}</span></span>` : ''}
              ${genre ? `<span> &nbsp;|&nbsp; <span class="meta-bold">${genre}</span></span>` : ''}
            </div>
            ${notes ? `<div class="notes-box">${notes}</div>` : ''}
          </div>
          <hr class="divider" />
          ${contentHtml}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  // ── Print Formatters ──────────────────────────────────────────────────────
  formatChordSheetForPrint(text?: string): string {
    if (!text) return '<div class="pc-plain">No lyrics or chords provided.</div>';

    const lines = text.split('\n');
    const result: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('#')) {
        const { label, tone } = this.parseSectionHeader(line);
        const toneHtml = tone ? `<span class="pc-tone">🎹 ${tone}</span>` : '';

        // Remove any gap immediately preceding this section
        while (result.length > 0 && result[result.length - 1] === '<span class="pc-gap"></span>') {
          result.pop();
        }

        result.push(`<div class="pc-section"><span>◆ ${label}</span>${toneHtml}</div>`);

        // Skip blank lines immediately following the section header
        while (i + 1 < lines.length && !lines[i + 1].trim()) {
          i++;
        }
        continue;
      }

      if (!trimmed) {
        if (result.length > 0 && result[result.length - 1] !== '<span class="pc-gap"></span>') {
          result.push('<span class="pc-gap"></span>');
        }
        continue;
      }

      if (!line.includes('[')) {
        result.push(`<div class="pc-plain">${line}</div>`);
        continue;
      }

      let chordRow = '';
      let lyricRow = '';

      const beforeFirst = line.match(/^([^[]+)\[/);
      if (beforeFirst) {
        const prefix = beforeFirst[1];
        chordRow += ' '.repeat(prefix.length);
        lyricRow += prefix;
      }

      const regex = /\[([^\]]+)\]([^[]*)/g;
      let match;
      while ((match = regex.exec(line)) !== null) {
        const chord = match[1];
        const lyric = match[2] ?? '';
        const width = Math.max(chord.length, lyric.length) + 1;
        chordRow += chord.padEnd(width);
        lyricRow += lyric.padEnd(width);
      }

      result.push(`<div><div class="pc-chord-row">${chordRow}</div><div class="pc-lyric-row">${lyricRow}</div></div>`);
    }

    return result.join('');
  }

  generateChordChartForPrint(): string {
    if (!this.song?.lyricsAndChords) return '<div class="pc-plain">No chords found.</div>';

    const lines = this.song.lyricsAndChords.split('\n');
    let html = '';
    let currentLabel = '';
    let currentTone = '';
    let sectionChords: string[] = [];

    const flushSection = () => {
      if (!sectionChords.length) return;

      const rows: string[][] = [];
      for (let i = 0; i < sectionChords.length; i += 8) {
        rows.push(sectionChords.slice(i, i + 8));
      }

      rows.forEach((row, idx) => {
        let prev = '';
        const cells = row.map(c => {
          const isRepeat = c === prev;
          const cellVal = isRepeat ? '%' : c;
          prev = c;
          return `<span class="chart-cell ${isRepeat ? 'chart-repeat' : ''}">${cellVal}</span>`;
        });
        const barHtml = `<span class="chart-pipe">||</span> ${cells.join('<span class="chart-pipe">|</span> ')} <span class="chart-pipe">||</span>`;
        let labelHtml = '';
        if (idx === 0) {
          const toneHtml = currentTone ? `<br><span class="chart-tone">🎹 ${currentTone}</span>` : '';
          labelHtml = `${currentLabel}${toneHtml}`;
        }

        html += `<div class="chart-row">
          <div class="chart-label">${labelHtml}</div>
          <div class="chart-bars">${barHtml}</div>
        </div>`;
      });

      sectionChords = [];
    };

    lines.forEach(line => {
      if (line.trim().startsWith('#')) {
        flushSection();
        const { label, tone } = this.parseSectionHeader(line);
        currentLabel = label;
        currentTone = tone;
      } else {
        const matches = [...line.matchAll(/\[([^\]]+)\]/g)].map(m => m[1]);
        sectionChords.push(...matches);
      }
    });

    flushSection();
    return html;
  }

  // ── Section color maps for screen ─────────────────────────────────────────
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

  private sectionTextColors: Record<string, string> = {
    'intro':      'text-violet-400',
    'verse':      'text-sky-400',
    'prechorus':  'text-amber-400',
    'pre-chorus': 'text-amber-400',
    'chorus':     'text-emerald-400',
    'bridge':     'text-rose-400',
    'outro':      'text-slate-400',
    'interlude':  'text-purple-400',
    'solo':       'text-orange-400',
  };

  // ── Screen Renderers ──────────────────────────────────────────────────────
  formatChordSheet(text?: string): string {
    if (!text) return '<span class="text-slate-500 italic">No lyrics or chords provided.</span>';

    const lines = text.split('\n');
    const result: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('#')) {
        const { label, tone } = this.parseSectionHeader(line);
        const key = label.toLowerCase().replace(/\s+\d+$/, '').replace(/[\s-]/g, '');
        const colorClass = this.sectionColors[key] || 'bg-slate-800 text-slate-300 border-slate-600/60';
        const toneHtml = tone
          ? `<span class="ml-2 text-xs font-medium text-amber-400/80 italic">🎹 ${tone}</span>`
          : '';

        // Remove any gap spacer immediately preceding this section
        while (result.length > 0 && result[result.length - 1] === '<div class="h-3"></div>') {
          result.pop();
        }

        const topMargin = result.length === 0 ? 'mt-1' : 'mt-5';
        result.push(`<div class="${topMargin} mb-1 flex items-center gap-1"><span class="inline-block font-bold text-xs uppercase tracking-widest px-3 py-0.5 rounded-md border ${colorClass}">◆ ${label}</span>${toneHtml}</div>`);

        // Skip blank lines immediately following the section header
        while (i + 1 < lines.length && !lines[i + 1].trim()) {
          i++;
        }
        continue;
      }

      if (!trimmed) {
        if (result.length > 0 && result[result.length - 1] !== '<div class="h-3"></div>') {
          result.push('<div class="h-3"></div>');
        }
        continue;
      }

      if (!line.includes('[')) {
        result.push(`<div class="text-slate-400 leading-tight whitespace-pre mb-2">${line}</div>`);
        continue;
      }

      let chordRow = '';
      let lyricRow = '';

      const beforeFirst = line.match(/^([^[]+)\[/);
      if (beforeFirst) {
        const prefix = beforeFirst[1];
        chordRow += ' '.repeat(prefix.length);
        lyricRow += prefix;
      }

      const regex = /\[([^\]]+)\]([^[]*)/g;
      let match;
      while ((match = regex.exec(line)) !== null) {
        const chord = match[1];
        const lyric = match[2] ?? '';
        const width = Math.max(chord.length, lyric.length) + 1;
        chordRow += chord.padEnd(width);
        lyricRow += lyric.padEnd(width);
      }

      result.push(`<div class="mb-2"><div class="text-sky-400 font-bold text-sm leading-none whitespace-pre">${chordRow}</div><div class="text-slate-200 leading-tight whitespace-pre">${lyricRow}</div></div>`);
    }

    return result.join('');
  }

  generateChordChart(): string {
    if (!this.song?.lyricsAndChords) return '';

    const lines = this.song.lyricsAndChords.split('\n');
    let html = '';
    let currentLabel = '';
    let currentTone = '';
    let sectionChords: string[] = [];

    const flushSection = () => {
      if (!sectionChords.length) return;

      const rows: string[][] = [];
      for (let i = 0; i < sectionChords.length; i += 8) {
        rows.push(sectionChords.slice(i, i + 8));
      }

      rows.forEach((row, idx) => {
        let prev = '';
        const cells = row.map(c => {
          const cell = c === prev ? '%' : c;
          prev = c;
          return `<span class="inline-block w-10 font-bold ${cell === '%' ? 'text-slate-500' : 'text-sky-300'}">${cell}</span>`;
        });
        const barHtml = `<span class="text-slate-500 mr-1">||</span>${cells.join('<span class="text-slate-600 mx-0.5">|</span>')}<span class="text-slate-500 ml-1">||</span>`;

        const key = currentLabel.toLowerCase().replace(/\s+\d+$/, '').replace(/[\s-]/g, '');
        const sectionColorClass = this.sectionTextColors[key] || 'text-slate-400';

        let labelHtml = '';
        if (idx === 0) {
          const toneTag = currentTone
            ? `<span class="block text-[10px] font-medium text-amber-400/70 italic normal-case tracking-normal mt-0.5">🎹 ${currentTone}</span>`
            : '';
          labelHtml = `<span class="font-bold text-xs uppercase tracking-wider ${sectionColorClass}">${currentLabel}</span>${toneTag}`;
        }

        html += `<div class="flex items-start gap-4 mb-1 font-mono text-sm">
          <div class="w-28 shrink-0 text-right">${labelHtml}</div>
          <div class="pt-0.5">${barHtml}</div>
        </div>`;
      });

      sectionChords = [];
    };

    lines.forEach(line => {
      if (line.trim().startsWith('#')) {
        flushSection();
        const { label, tone } = this.parseSectionHeader(line);
        currentLabel = label;
        currentTone = tone;
      } else {
        const matches = [...line.matchAll(/\[([^\]]+)\]/g)].map(m => m[1]);
        sectionChords.push(...matches);
      }
    });

    flushSection();
    return html;
  }
}