import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiTeacher } from '../services/api-teacher';
import { ToastService } from '../../../core/services/toast-service';

interface TeacherSchool {
  id: number;
  name: string;
}

@Component({
  selector: 'app-teacher-nfc-register-page',
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './teacher-nfc-register-page.html',
  styleUrl: './teacher-nfc-register-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherNfcRegisterPage {
  readonly schools = signal<TeacherSchool[]>([]);
  readonly isLoading = signal(false);
  readonly isSubmitted = signal(false);
  readonly showPassword = signal(false);

  readonly classLevels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  readonly divisions = ['A', 'B', 'C', 'D', 'E'];
  readonly bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '0+ve', '0-ve'];
  readonly relations = ['Father', 'Mother', 'Guardian', 'Sibling', 'Relative', 'Other'];
  readonly steps = ['Personal', 'Academic', 'Contact', 'Address'];
  readonly currentStep = signal(0);

  private readonly fb = inject(FormBuilder);
  private readonly apiTeacher = inject(ApiTeacher);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly uid = this.route.snapshot.paramMap.get('uid');
  readonly form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      birthDate: ['', Validators.required],
      bloodGroup: ['', Validators.required],
      classTeacherOfClassLevel: ['', Validators.required],
      classTeacherOfDivision: ['', Validators.required],
      schoolId: [0, Validators.required],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      emailId: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      emergencyContactName: ['', Validators.required],
      emergencyContactNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      emergencyContactRelation: ['', Validators.required],
      alternateNumber: [''],
      addressLineOne: ['', Validators.required],
      addressLineTwo: [''],
      city: ['', Validators.required],
      pinCode: [''],
      state: ['', Validators.required],
      country: ['', Validators.required],
    });
    this.loadSchools();
  }

  get f() { return this.form.controls; }

  isStepValid(step: number): boolean {
    const groups = [
      ['firstName', 'lastName', 'birthDate', 'bloodGroup'],
      ['classTeacherOfClassLevel', 'classTeacherOfDivision', 'schoolId'],
      ['mobileNumber', 'emailId', 'password', 'emergencyContactName', 'emergencyContactNumber', 'emergencyContactRelation'],
      ['addressLineOne', 'city', 'state', 'country'],
    ];
    return groups[step].every(controlName => this.form.get(controlName)?.valid);
  }

  nextStep(): void {
    if (this.isStepValid(this.currentStep())) {
      this.currentStep.update(step => Math.min(step + 1, this.steps.length - 1));
    } else {
      this.markStepTouched(this.currentStep());
    }
  }

  prevStep(): void {
    this.currentStep.update(step => Math.max(step - 1, 0));
  }

  submit(): void {
    if (this.form.invalid || !this.uid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.f['password'].value !== this.f['confirmPassword'].value) {
      this.toast.error('Passwords do not match.');
      return;
    }
    const value = this.form.getRawValue();
    const payload = {
      firstName: value.firstName,
      lastName: value.lastName,
      middleName: value.middleName || null,
      classTeacherOfClassLevel: value.classTeacherOfClassLevel,
      classTeacherOfDivision: value.classTeacherOfDivision,
      bloodGroup: value.bloodGroup,
      birthDate: value.birthDate,
      mobileNumber: value.mobileNumber,
      emailId: value.emailId,
      password: value.password,
      emergencyContactNumber: value.emergencyContactNumber,
      emergencyContactName: value.emergencyContactName,
      emergencyContactRelation: value.emergencyContactRelation,
      alternateNumber: value.alternateNumber,
      addressLineOne: value.addressLineOne,
      addressLineTwo: value.addressLineTwo,
      city: value.city,
      pinCode: value.pinCode,
      state: value.state,
      country: value.country,
      schoolId: Number(value.schoolId),
    };

    this.isLoading.set(true);
    this.apiTeacher.registerTeacher(this.uid, payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSubmitted.set(true);
        this.toast.success('Registration successful!');
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('Registration failed. Please try again.');
      },
    });
  }

  private loadSchools(): void {
    this.apiTeacher.getSchoolsList().subscribe({
      next: schools => this.schools.set(schools),
      error: () => this.toast.error('Could not load school list.'),
    });
  }

  private markStepTouched(step: number): void {
    const groups = [
      ['firstName', 'lastName', 'birthDate', 'bloodGroup'],
      ['classTeacherOfClassLevel', 'classTeacherOfDivision', 'schoolId'],
      ['mobileNumber', 'emailId', 'password', 'emergencyContactName', 'emergencyContactNumber', 'emergencyContactRelation'],
      ['addressLineOne', 'city', 'state', 'country'],
    ];
    groups[step].forEach(controlName => this.form.get(controlName)?.markAsTouched());
  }
}
