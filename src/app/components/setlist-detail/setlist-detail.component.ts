import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Setlist, SetlistSongRequest } from '../../Models/setlist.model';
import { Song } from '../../Models/song.model';
import { SetlistService } from '../../services/setlist.service';
import { SongService } from '../../services/song.service';

@Component({
  selector: 'app-setlist-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './setlist-detail.component.html',
})
export class SetlistDetailComponent implements OnInit {
  setlist?: Setlist;
  allSongs: Song[] = [];
  isLoading: boolean = true;
  showAddModal: boolean = false;

  // New song to add to setlist
  newSongRequest: SetlistSongRequest = {
    songId: 0,
    performanceKey: '',
    performanceBpm: undefined,
    notes: ''
  };

  keys: string[] = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

  constructor(
    private setlistService: SetlistService,
    private songService: SongService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadSetlist(Number(idParam));
      this.loadAllLibrarySongs();
    }
  }

  loadSetlist(id: number): void {
    this.isLoading = true;
    this.setlistService.getSetlistById(id).subscribe({
      next: (data) => {
        this.setlist = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading setlist', err);
        this.isLoading = false;
      }
    });
  }

  loadAllLibrarySongs(): void {
    this.songService.getAllSongs().subscribe({
      next: (data) => this.allSongs = data,
      error: (err) => console.error('Error loading library songs', err)
    });
  }

  onSongSelect(songId: number): void {
    const selectedSong = this.allSongs.find(s => s.id === Number(songId));
    if (selectedSong) {
      this.newSongRequest.performanceKey = selectedSong.originalKey;
      this.newSongRequest.performanceBpm = selectedSong.bpm;
      this.newSongRequest.notes = selectedSong.notes || '';
    }
  }

  openAddModal(): void {
    if (this.allSongs.length > 0) {
      this.newSongRequest.songId = this.allSongs[0].id;
      this.onSongSelect(this.allSongs[0].id);
    }
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  addSongToSetlist(): void {
    if (!this.setlist || !this.newSongRequest.songId) return;

    this.setlistService.addSongToSetlist(this.setlist.id, this.newSongRequest).subscribe({
      next: (updatedSetlist) => {
        this.setlist = updatedSetlist;
        this.closeAddModal();
      },
      error: (err) => console.error('Error adding song to setlist', err)
    });
  }

  removeSong(setlistSongId: number): void {
    if (!this.setlist) return;
    if (confirm('Remove this song from the setlist?')) {
      this.setlistService.removeSongFromSetlist(this.setlist.id, setlistSongId).subscribe({
        next: (updated) => {
          this.setlist = updated;
        },
        error: (err) => console.error('Error removing song', err)
      });
    }
  }

  // ── Song Reordering ────────────────────────────────────────────────────────
  moveSongUp(index: number): void {
    if (!this.setlist?.songs || index <= 0) return;
    const songs = this.setlist.songs;
    [songs[index], songs[index - 1]] = [songs[index - 1], songs[index]];
    this.saveReorder();
  }

  moveSongDown(index: number): void {
    if (!this.setlist?.songs || index >= this.setlist.songs.length - 1) return;
    const songs = this.setlist.songs;
    [songs[index], songs[index + 1]] = [songs[index + 1], songs[index]];
    this.saveReorder();
  }

  private saveReorder(): void {
    if (!this.setlist?.songs) return;
    const ids = this.setlist.songs.map(s => s.id);
    this.setlistService.reorderSongs(this.setlist.id, ids).subscribe({
      next: (updated) => {
        this.setlist = updated;
      },
      error: (err) => console.error('Error reordering songs', err)
    });
  }

  // ── Total Duration Calculator ──────────────────────────────────────────────
  getTotalDuration(): string {
    if (!this.setlist?.songs || this.setlist.songs.length === 0) return '';

    let totalSeconds = 0;
    let hasDuration = false;

    for (const song of this.setlist.songs) {
      // Look up duration from allSongs by songId
      const librarySong = this.allSongs.find(s => s.id === song.songId);
      if (librarySong?.duration) {
        hasDuration = true;
        const parts = librarySong.duration.split(':');
        if (parts.length === 2) {
          totalSeconds += parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        }
      }
    }

    if (!hasDuration) return '';

    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  }
}