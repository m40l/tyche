import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GamesComponent } from 'src/components/games/games.component';
import { GroupsComponent } from 'src/components/group/groups.component';
import { SessionComponent } from 'src/components/session/session.component';
import { SessionsComponent } from 'src/components/sessions/sessions.component';
import { AboutComponent } from 'src/components/about/about.component';

const routes: Routes = [
    { path: '', redirectTo: '/sessions', pathMatch: 'full' },
    {
        path: 'sessions',
        component: SessionsComponent,
    },
    {
        path: 'session/:id',
        component: SessionComponent,
    },
    { path: 'groups', component: GroupsComponent },
    { path: 'games', component: GamesComponent },
    { path: 'about', component: AboutComponent },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
