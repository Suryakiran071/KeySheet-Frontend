import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Song, SongRequest } from '../Models/song.model';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SongService {

  private apiUrl = `${environment.apiUrl}/songs`;
  constructor(private http: HttpClient) { }

  getAllSongs(): Observable<Song[]> {
    return this.http.get<Song[]>(this.apiUrl);
  }

  getSongById(id: number): Observable<Song> {
    return this.http.get<Song>(`${this.apiUrl}/${id}`);
  }

  createSong(song: SongRequest): Observable<Song> {
    return this.http.post<Song>(this.apiUrl, song);
  }

  updateSong(id: number, song: SongRequest): Observable<Song> {
    return this.http.put<Song>(`${this.apiUrl}/${id}`, song);
  }

  deleteSong(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  transposeSong(id:number, targetKey?:string, semitones?:number): Observable<Song> {
    let params=new HttpParams();
    if(targetKey){
      params=params.set('targetKey',targetKey);
    }
    if(semitones!==undefined && semitones!==null){
      params=params.set('semitones',semitones.toString());
    }
    return this.http.get<Song>(`${this.apiUrl}/${id}/transpose`, { params });
  }
  searchSongs(query?: string,key?:string, genre?:string): Observable<Song[]> {
    let params=new HttpParams();
    if(query){
      params=params.set('query',query);
    }
    if(key){
      params=params.set('key',key);
    }
    if(genre){
      params=params.set('genre',genre);
    }
    return this.http.get<Song[]>(`${this.apiUrl}/search`, { params });
  }
}
