import { Routes } from '@angular/router';
import { LoginComponent } from '@features/login/login';
import { SetupCardComponent } from '@features/setup-card/setup-card';
import { RegistrationComponent } from '@features/registration/registration';
import { Registration } from './card-based-features/registration/registration';
import { SetUpProfile } from './card-based-features/set-up-profile/set-up-profile';
import { LandingPage } from './card-based-features/landing-page/landing-page';
import { HomePage } from '@features/home-page/home-page';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
  { path: 'setup', component: SetupCardComponent },
  { path: 'register/:type', component: RegistrationComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'registration/:uid', component: Registration},
  { path: 'setup-profile/:uid/:type/:userId', component: SetUpProfile },
  { path: 'card/:uid', component: LandingPage },
  { path: 'home-page', component: HomePage }
];