import { Component, ElementRef, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiTapaxeAdmin, School } from '../services/api-tapaxe-admin';
import { NfcScanner } from '../nfc-scanner/nfc-scanner';

export type SuperAdminTab = 'school' | 'admin' | 'nfc';

@Component({
  selector: 'app-tapaxe-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, NfcScanner],
  templateUrl: './tapaxe-admin-dashboard.html',
  styleUrl: './tapaxe-admin-dashboard.scss',
})
export class TapaxeAdminDashboard implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiTapaxeAdmin);
  private readonly elRef = inject(ElementRef);

  // Active Tab
  readonly activeTab = signal<SuperAdminTab>('school');

  setTab(tab: SuperAdminTab): void {
    this.activeTab.set(tab);
    if (tab === 'admin' && this.schools().length === 0) {
      this.loadSchools();
    }
  }

  // Real verified data from backend API
  readonly schools = signal<School[]>([]);
  readonly schoolsLoading = signal(false);

  loadSchools(): void {
    this.schoolsLoading.set(true);
    this.api.getSchools().subscribe({
      next: (res) => {
        this.schools.set(res.data ?? []);
        this.schoolsLoading.set(false);
      },
      error: () => {
        this.schoolsLoading.set(false);
      }
    });
  }

  // ── Tab 1: Add School ───────────────────────────────────────────────────────
  schoolForm!: FormGroup;
  readonly schoolLoading = signal(false);
  readonly schoolSuccess = signal(false);
  readonly schoolError = signal<string | null>(null);

  get sf() { return this.schoolForm.controls; }

  submitSchool(): void {
    this.schoolForm.markAllAsTouched();
    if (this.schoolForm.invalid) return;

    this.schoolLoading.set(true);
    this.schoolError.set(null);

    const payload = this.schoolForm.value;
    this.api.addSchool(payload).subscribe({
      next: (res) => {
        this.schoolLoading.set(false);
        if (res.success) {
          this.schoolSuccess.set(true);
          this.schoolForm.reset();
          // Immediately refresh school registry count and dropdown options
          this.loadSchools();
        } else {
          this.schoolError.set(res.message || 'Failed to add school.');
        }
      },
      error: (err) => {
        this.schoolLoading.set(false);
        this.schoolError.set(err?.error?.message || 'Something went wrong.');
      }
    });
  }

  // ── Tab 2: Add School Admin ─────────────────────────────────────────────────
  adminForm!: FormGroup;
  readonly adminLoading = signal(false);
  readonly adminSuccess = signal(false);
  readonly adminError = signal<string | null>(null);

  // Independent Password Toggles (Batch 2 fix)
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  toggleShowPassword(): void {
    this.showPassword.update(v => !v);
  }

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }

  // Custom School Dropdown (Batch 2 fix: click-outside & Escape key dismiss)
  readonly schoolDropdownOpen = signal(false);
  readonly schoolSearchTerm = signal('');

  readonly filteredSchools = computed(() => {
    const term = this.schoolSearchTerm().toLowerCase().trim();
    if (!term) return this.schools();
    return this.schools().filter(s => s.name.toLowerCase().includes(term));
  });

  toggleSchoolDropdown(): void {
    this.schoolDropdownOpen.update(v => !v);
    if (this.schoolDropdownOpen() && this.schools().length === 0) {
      this.loadSchools();
    }
  }

  selectSchool(id: number | null): void {
    this.adminForm.patchValue({ schoolId: id });
    this.adminForm.get('schoolId')?.markAsTouched();
    this.schoolDropdownOpen.set(false);
    this.schoolSearchTerm.set('');
  }

  selectedSchoolName(): string {
    const id = this.af['schoolId']?.value;
    if (!id) return 'Select a school';
    return this.schools().find(s => s.id === id)?.name ?? 'Select a school';
  }

  // Click-outside listener
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.schoolDropdownOpen()) return;
    const target = event.target as HTMLElement;
    if (!this.elRef.nativeElement.querySelector('.custom-select')?.contains(target)) {
      this.schoolDropdownOpen.set(false);
      this.schoolSearchTerm.set('');
    }
  }

  // Escape key listener
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.schoolDropdownOpen()) {
      this.schoolDropdownOpen.set(false);
      this.schoolSearchTerm.set('');
    }
  }

  get af() { return this.adminForm.controls; }

  submitAdmin(): void {
    this.adminForm.markAllAsTouched();
    if (this.adminForm.invalid) return;

    if (this.af['confirmPassword'].value !== this.af['password'].value) {
      this.adminError.set('Passwords do not match. Please verify your password entry.');
      return;
    }

    this.adminLoading.set(true);
    this.adminError.set(null);

    const { confirmPassword, ...payload } = this.adminForm.value;
    this.api.addSchoolAdmin(payload).subscribe({
      next: (res) => {
        this.adminLoading.set(false);
        if (res.success) {
          this.adminSuccess.set(true);
          this.adminForm.reset();
        } else {
          this.adminError.set(res.message || 'Failed to add administrator.');
        }
      },
      error: (err) => {
        this.adminLoading.set(false);
        this.adminError.set(err?.error?.message || 'Something went wrong while creating administrator.');
      }
    });
  }

  // ── Input Sanitization Helpers ─────────────────────────────────────────────
  sanitizePhone(event: Event, controlName: string, form: FormGroup): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = cleaned;
    form.get(controlName)?.setValue(cleaned, { emitEvent: true });
  }

  sanitizePinCode(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\D/g, '').slice(0, 6);
    input.value = cleaned;
    this.schoolForm.get('pinCode')?.setValue(cleaned, { emitEvent: true });
  }

  ngOnInit(): void {
    // 1. Initial real-data load for active school KPI
    this.loadSchools();

    // 2. Initialize School Registration Form
    this.schoolForm = this.fb.group({
      schoolName:     ['', [Validators.required, Validators.minLength(3)]],
      schoolContact:  ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      schoolEmailId:  ['', [Validators.required, Validators.email]],
      addressLineOne: ['', Validators.required],
      addressLineTwo: [null],
      city:           ['', Validators.required],
      pinCode:        ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      state:          ['', Validators.required],
      country:        ['', Validators.required],
    });

    // 3. Initialize School Admin Form
    this.adminForm = this.fb.group({
      firstName:       ['', [Validators.required, Validators.minLength(2)]],
      middleName:      [null],
      lastName:        ['', [Validators.required, Validators.minLength(2)]],
      mobileNo:        ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      emailId:         ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      schoolId:        [null, Validators.required],
    });
  }
}
