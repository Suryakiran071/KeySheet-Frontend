import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SetlistRequest } from '../../Models/setlist.model';
import { SetlistService } from '../../services/setlist.service';

@Component({
  selector: 'app-setlist-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './setlist-form.component.html',
})
export class SetlistFormComponent implements OnInit {
  isEditMode: boolean = false;
  setlistId?: number;
  isLoading: boolean = false;

  setlist: SetlistRequest = {
    name: '',
    eventDate: '',
    venue: '',
    description: ''
  };

  constructor(
    private setlistService: SetlistService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.setlistId = Number(idParam);
      this.loadSetlist(this.setlistId);
    }
  }

  loadSetlist(id: number): void {
    this.isLoading = true;
    this.setlistService.getSetlistById(id).subscribe({
      next: (data) => {
        this.setlist = {
          name: data.name,
          eventDate: data.eventDate,
          venue: data.venue,
          description: data.description
        };
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading setlist', err);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (!this.setlist.name) {
      alert('Setlist name is required!');
      return;
    }

    this.isLoading = true;

    if (this.isEditMode && this.setlistId) {
      this.setlistService.updateSetlist(this.setlistId, this.setlist).subscribe({
        next: (updated) => {
          this.router.navigate(['/setlists', updated.id]);
        },
        error: (err) => {
          console.error('Error updating setlist', err);
          this.isLoading = false;
        }
      });
    } else {
      this.setlistService.createSetlist(this.setlist).subscribe({
        next: (created) => {
          this.router.navigate(['/setlists', created.id]);
        },
        error: (err) => {
          console.error('Error creating setlist', err);
          this.isLoading = false;
        }
      });
    }
  }
}