import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Setlist, SetlistRequest, SetlistSongRequest } from '../Models/setlist.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SetlistService {
  private apiUrl = 'http://localhost:8081/api/setlists';

  constructor(private http: HttpClient) {}

  getAllSetlists(): Observable<Setlist[]> {
    return this.http.get<Setlist[]>(this.apiUrl);
  }

  getSetlistById(id: number): Observable<Setlist> {
    return this.http.get<Setlist>(`${this.apiUrl}/${id}`);
  }

  createSetlist(setlist: SetlistRequest): Observable<Setlist> {
    return this.http.post<Setlist>(this.apiUrl, setlist);
  }

  updateSetlist(id: number, setlist: SetlistRequest): Observable<Setlist> {
    return this.http.put<Setlist>(`${this.apiUrl}/${id}`, setlist);
  }

  deleteSetlist(setlistId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${setlistId}`);
  }

  addSongToSetlist(setlistId: number, request: SetlistSongRequest): Observable<Setlist> {
    return this.http.post<Setlist>(`${this.apiUrl}/${setlistId}/songs`, request);
  }

  removeSongFromSetlist(setlistId: number, setlistSongId: number): Observable<Setlist> {
    return this.http.delete<Setlist>(`${this.apiUrl}/${setlistId}/songs/${setlistSongId}`);
  }

  reorderSongs(setlistId: number, setlistSongIds: number[]): Observable<Setlist> {
    return this.http.put<Setlist>(`${this.apiUrl}/${setlistId}/songs/reorder`, setlistSongIds);
  }
}