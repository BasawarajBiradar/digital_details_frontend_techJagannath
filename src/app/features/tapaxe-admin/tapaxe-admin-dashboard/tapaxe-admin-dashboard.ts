import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiTapaxeAdmin, School } from '../services/api-tapaxe-admin';
import { NfcScanner } from '../nfc-scanner/nfc-scanner';

type Tab = 'school' | 'admin' | 'nfc';

@Component({
  selector: 'app-tapaxe-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, NfcScanner],
  templateUrl: './tapaxe-admin-dashboard.html',
  styleUrl: './tapaxe-admin-dashboard.scss',
})
export class TapaxeAdminDashboard implements OnInit {

  activeTab = signal<Tab>('school');

  setTab(tab: Tab) {
    this.activeTab.set(tab);
    if (tab === 'admin' && this.schools().length === 0) this.loadSchools();
  }

  schools        = signal<School[]>([]);
  schoolsLoading = signal(false);

  loadSchools() {
    this.schoolsLoading.set(true);
    this.api.getSchools().subscribe({
      next: (res) => { this.schools.set(res.data ?? []); this.schoolsLoading.set(false); },
      error: ()    => { this.schoolsLoading.set(false); }
    });
  }

  schoolForm!: FormGroup;
  schoolLoading = signal(false);
  schoolSuccess = signal(false);
  schoolError   = signal<string | null>(null);
  schoolDropdownOpen = signal(false);

  toggleSchoolDropdown() {
    this.schoolDropdownOpen.set(!this.schoolDropdownOpen());
  }

selectSchool(id: number | null) {
  this.adminForm.patchValue({ schoolId: id });
  this.adminForm.get('schoolId')?.markAsTouched();
  this.schoolDropdownOpen.set(false);
}

selectedSchoolName(): string {
  const id = this.af['schoolId'].value;
  if (!id) return 'Select a school';
  return this.schools().find(s => s.id === id)?.name ?? 'Select a school';
}

  get sf() { return this.schoolForm.controls; }

  submitSchool() {
    this.schoolForm.markAllAsTouched();
    if (this.schoolForm.invalid) return;
    this.schoolLoading.set(true);
    this.schoolError.set(null);
    const { ...payload } = this.schoolForm.value;
    this.api.addSchool(payload).subscribe({
      next: (res) => {
        this.schoolLoading.set(false);
        if (res.success) { this.schoolSuccess.set(true); this.schoolForm.reset(); }
        else              this.schoolError.set(res.message || 'Failed to add school.');
      },
      error: (err) => {
        this.schoolLoading.set(false);
        this.schoolError.set(err?.error?.message || 'Something went wrong.');
      }
    });
  }

  adminForm!: FormGroup;
  adminLoading      = signal(false);
  adminSuccess      = signal(false);
  adminError        = signal<string | null>(null);
  showAdminPassword = signal(false);

  get af() { return this.adminForm.controls; }

  submitAdmin() {
    this.adminForm.markAllAsTouched();
    if (this.adminForm.invalid) return;
    if (this.af['confirmPassword'].value !== this.af['password'].value) return;
    this.adminLoading.set(true);
    this.adminError.set(null);
    const { confirmPassword, ...payload } = this.adminForm.value;
    this.api.addSchoolAdmin(payload).subscribe({
      next: (res) => {
        this.adminLoading.set(false);
        if (res.success) { this.adminSuccess.set(true); this.adminForm.reset(); }
        else              this.adminError.set(res.message || 'Failed to add admin.');
      },
      error: (err) => {
        this.adminLoading.set(false);
        this.adminError.set(err?.error?.message || 'Something went wrong.');
      }
    });
  }

  constructor(private fb: FormBuilder, private api: ApiTapaxeAdmin) {}

  ngOnInit(): void {
    this.schoolForm = this.fb.group({
      schoolName:     ['', Validators.required],
      schoolContact:  ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      schoolEmailId:  ['', [Validators.required, Validators.email]],
      addressLineOne: ['', Validators.required],
      addressLineTwo: [null],
      city:           ['', Validators.required],
      pinCode:        ['', Validators.required],
      state:          ['', Validators.required],
      country:        ['', Validators.required],
    });

    this.adminForm = this.fb.group({
      firstName:       ['', Validators.required],
      middleName:      [null],
      lastName:        ['', Validators.required],
      mobileNo:        ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      emailId:         ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      schoolId:        [null, Validators.required],
    });
  }
}