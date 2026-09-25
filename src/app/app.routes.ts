import { Routes } from '@angular/router';
import { LoginComponent } from '@features/login/login';
import { AttendenceDetailsPage } from '@features/school-admin/attendence-details-page/attendence-details-page';
import { SchoolAdminDashboard } from '@features/school-admin/school-admin-dashboard/school-admin-dashboard';
import { StudentDashboard } from '@features/student/student-dashboard/student-dashboard';
import { StudentAttendanceDetailsComponent } from '@features/student/student-attendance-details/student-attendance-details';
import { StudentTapPhotos } from '@features/student/student-tap-photos/student-tap-photos';
import { TeacherDashboard } from '@features/teacher/teacher-dashboard/teacher-dashboard';
import { TeacherAttendanceDetails } from '@features/teacher/teacher-attendance-details/teacher-attendance-details';
import { TeacherTapPhotos } from '@features/teacher/teacher-tap-photos/teacher-tap-photos';
import { TeacherNfcLandingPage } from '@features/teacher/teacher-nfc-landingpage/teacher-nfc-landingpage';
import { TeacherNfcRegisterPage } from '@features/teacher/teacher-nfc-register-page/teacher-nfc-register-page';
import { StudentNfcLandingpage } from '@features/student/student-nfc-landingpage/student-nfc-landingpage';
import { StudentNfcRegisterPage } from '@features/student/student-nfc-register-page/student-nfc-register-page';

import { NfcScanner } from '@features/tapaxe-admin/nfc-scanner/nfc-scanner';
import { TapaxeAdminDashboard } from '@features/tapaxe-admin/tapaxe-admin-dashboard/tapaxe-admin-dashboard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {path: 'student-dashboard', component: StudentDashboard},
  {path: 'student/attendance-details', component: StudentAttendanceDetailsComponent},
  {path: 'student/tap-photos', component: StudentTapPhotos},
  {path: 'teacher-dashboard', component: TeacherDashboard},
  {path: 'teacher/attendance-details', component: TeacherAttendanceDetails},
  {path: 'teacher/tap-photos', component: TeacherTapPhotos},
  {path: 'teacher/:uid', component: TeacherNfcLandingPage},
  {path: 'teacher-register/:uid', component: TeacherNfcRegisterPage},
  {path: 'student/:uid', component: StudentNfcLandingpage},
  {path: 'register/:uid', component: StudentNfcRegisterPage}, 
  {path: 'nfc-scanner', component: NfcScanner},
  { path: 'school-admin-dashboard', component: SchoolAdminDashboard},
  {path: 'tapaxe-admin-dashboard', component: TapaxeAdminDashboard},
  {path: 'school-admin/attendance-details', component: AttendenceDetailsPage}
];