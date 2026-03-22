import { Routes } from '@angular/router';
import { SetupCardComponent } from '@features/setup-card/setup-card';

export const routes: Routes = [
  { path: 'setup', component: SetupCardComponent },
  { path: '', redirectTo: 'setup', pathMatch: 'full' }
];