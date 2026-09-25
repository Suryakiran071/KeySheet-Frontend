import { Routes } from '@angular/router';
import { SongFormComponent } from './components/song-form/song-form.component';
import { SongDetailComponent } from './components/song-detail/song-detail.component';
import { SongListComponent } from './components/song-list/song-list.component';
import { SetlistListComponent } from './components/setlist-list/setlist-list.component';
import { SetlistDetailComponent } from './components/setlist-detail/setlist-detail.component';
import { SetlistFormComponent } from './components/setlist-form/setlist-form.component';
import { PerformanceModeComponent } from './components/performance-mode/performance-mode.component';

export const routes: Routes = [
    //home route
    {path: '', redirectTo: '/songs', pathMatch: 'full'},

    //songs route
    {path: 'songs', component: SongListComponent},
    {path: 'songs/new', component: SongFormComponent},
    {path: 'songs/:id/edit', component: SongFormComponent},
    {path: 'songs/:id', component: SongDetailComponent},    

    //setlists route
    {path: 'setlists', component: SetlistListComponent},
    { path: 'setlists/new', component: SetlistFormComponent },
    {path: 'setlists/:id', component: SetlistDetailComponent},
    {path: 'setlists/:id/edit', component: SetlistFormComponent},
    {path: 'setlists/:id/perform', component: PerformanceModeComponent},

    //wildcard route
    {path: '**', redirectTo: '/songs'}
];
