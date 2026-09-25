import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Song } from '../../Models/song.model';
import { SongService } from '../../services/song.service';

@Component({
  selector: 'app-song-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './song-list.component.html',
})
export class SongListComponent implements OnInit {
  songs: Song[] = [];
  searchQuery: string = '';
  selectedKey: string = '';
  selectedGenre: string = '';
  isLoading: boolean = true;

  keys: string[] = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  genres: string[] = ['Bollywood', 'Pop', 'Rock', 'Acoustic', 'Jazz', 'Classical', 'Worship', 'Other'];

  constructor(private songService: SongService) {}

  ngOnInit(): void {
    this.loadSongs();
  }

  loadSongs(): void {
    this.isLoading = true;
    this.songService.getAllSongs().subscribe({
      next: (data: Song[]) => {
        this.songs = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading songs', err);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.isLoading = true;
    this.songService.searchSongs(this.searchQuery, this.selectedKey, this.selectedGenre).subscribe({
      next: (data: Song[]) => {
        this.songs = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error searching songs', err);
        this.isLoading = false;
      }
    });
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedKey = '';
    this.selectedGenre = '';
    this.loadSongs();
  }

  deleteSong(id: number, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this song?')) {
      this.songService.deleteSong(id).subscribe({
        next: () => {
          this.songs = this.songs.filter(s => s.id !== id);
        },
        error: (err) => console.error('Error deleting song', err)
      });
    }
  }
}