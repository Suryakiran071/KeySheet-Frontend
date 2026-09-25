import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Setlist } from '../../Models/setlist.model';
import { SetlistService } from '../../services/setlist.service';

@Component({
  selector: 'app-setlist-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './setlist-list.component.html',
})
export class SetlistListComponent implements OnInit {
  setlists: Setlist[] = [];
  isLoading: boolean = true;

  constructor(private setlistService: SetlistService) {}

  ngOnInit(): void {
    this.loadSetlists();
  }

  loadSetlists(): void {
    this.isLoading = true;
    this.setlistService.getAllSetlists().subscribe({
      next: (data) => {
        this.setlists = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading setlists', err);
        this.isLoading = false;
      }
    });
  }

  deleteSetlist(id: number, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this setlist?')) {
      this.setlistService.deleteSetlist(id).subscribe({
        next: () => {
          this.setlists = this.setlists.filter(s => s.id !== id);
        },
        error: (err) => console.error('Error deleting setlist', err)
      });
    }
  }
}