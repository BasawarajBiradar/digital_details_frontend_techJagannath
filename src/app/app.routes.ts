import { Routes } from '@angular/router';
import { LoginComponent } from '@features/login/login';
import { StudentDashboard } from '@features/student/student-dashboard/student-dashboard';
import { StudentNfcLandingpage } from '@features/student/student-nfc-landingpage/student-nfc-landingpage';
import { StudentNfcRegisterPage } from '@features/student/student-nfc-register-page/student-nfc-register-page';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {path: 'student-dashboard', component: StudentDashboard},
  {path: 'student/:uid', component: StudentNfcLandingpage},
  {path: 'register/:uid', component: StudentNfcRegisterPage}

];