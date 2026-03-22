import { Routes } from '@angular/router';
import { LoginComponent } from '@features/login/login';
import { SetupCardComponent } from '@features/setup-card/setup-card';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
  { path: 'setup', component: SetupCardComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];