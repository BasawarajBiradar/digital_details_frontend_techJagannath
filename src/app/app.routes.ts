import { Routes } from '@angular/router';
import { LoginComponent } from '@features/login/login';
import { SchoolAdminDashboard } from '@features/school-admin/school-admin-dashboard/school-admin-dashboard';
import { StudentDashboard } from '@features/student/student-dashboard/student-dashboard';
import { StudentNfcLandingpage } from '@features/student/student-nfc-landingpage/student-nfc-landingpage';
import { StudentNfcRegisterPage } from '@features/student/student-nfc-register-page/student-nfc-register-page';

import { NfcScanner } from '@features/tapaxe-admin/nfc-scanner/nfc-scanner';
import { TapaxeAdminDashboard } from '@features/tapaxe-admin/tapaxe-admin-dashboard/tapaxe-admin-dashboard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {path: 'student-dashboard', component: StudentDashboard},
  {path: 'student/:uid', component: StudentNfcLandingpage},
  {path: 'register/:uid', component: StudentNfcRegisterPage}, 
  {path: 'nfc-scanner', component: NfcScanner},
  { path: 'school-admin-dashboard', component: SchoolAdminDashboard},
  {path: 'tapaxe-admin-dashboard', component: TapaxeAdminDashboard}
];