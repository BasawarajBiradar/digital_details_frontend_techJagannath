import { Routes } from '@angular/router';
import { LoginComponent } from '@features/login/login';
import { StudentDashboard } from '@features/student/student-dashboard/student-dashboard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {path: 'student-dashboard', component: StudentDashboard}
];