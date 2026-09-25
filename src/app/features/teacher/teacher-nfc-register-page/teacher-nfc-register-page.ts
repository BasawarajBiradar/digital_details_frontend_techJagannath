import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiTeacher } from '../services/api-teacher';
import { ToastService } from '../../../core/services/toast-service';

@Component({
  selector: 'app-teacher-nfc-register-page',
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './teacher-nfc-register-page.html',
  styleUrl: './teacher-nfc-register-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherNfcRegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly apiTeacher = inject(ApiTeacher);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly showPassword = signal(false);
  readonly uid = this.route.snapshot.paramMap.get('uid');
  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    employeeId: ['', Validators.required],
    department: [''],
    designation: ['', Validators.required],
    emailId: ['', [Validators.required, Validators.email]],
    contactNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid || !this.uid) { this.form.markAllAsTouched(); return; }
    if (this.form.controls.password.value !== this.form.controls.confirmPassword.value) {
      this.toast.error('Passwords do not match.');
      return;
    }
    this.loading.set(true);
    this.apiTeacher.registerTeacher(this.uid, this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.submitted.set(true);
        this.toast.success('Registration successful!');
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: () => { this.loading.set(false); this.toast.error('Registration failed. Please try again.'); },
    });
  }
}
