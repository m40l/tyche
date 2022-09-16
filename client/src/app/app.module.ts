import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgSelectModule } from '@ng-select/ng-select';
import { AppRoutingModule } from 'src/app-routing.module';
import { AppComponent } from 'src/app.component';
import { GamesComponent } from 'src/components/games/games.component';
import { GroupsComponent } from 'src/components/group/groups.component';
import { LoginComponent } from 'src/components/login/login.component';
import { NavbarComponent } from 'src/components/navbar/navbar.component';
import { SessionComponent } from 'src/components/session/session.component';
import { SessionsComponent } from 'src/components/sessions/sessions.component';

@NgModule({
    declarations: [
        AppComponent,
        SessionsComponent,
        SessionComponent,
        GroupsComponent,
        LoginComponent,
        NavbarComponent,
        GamesComponent,
    ],
    imports: [BrowserModule, AppRoutingModule, HttpClientModule, FormsModule, ReactiveFormsModule, NgSelectModule],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
