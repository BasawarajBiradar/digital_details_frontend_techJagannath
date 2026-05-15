import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiStudent } from '../services/api-student';
import { ToastService } from '../../../core/services/toast-service';

interface School {
  id:   number;
  name: string;
}

@Component({
  selector: 'app-student-nfc-register-page',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './student-nfc-register-page.html',
  styleUrl:    './student-nfc-register-page.scss',
})
export class StudentNfcRegisterPage implements OnInit {

  readonly schools     = signal<School[]>([]);
  readonly isLoading   = signal(false);
  readonly isSubmitted = signal(false);

  readonly classLevels = ['1','2','3','4','5','6','7','8','9','10','11','12'];
  readonly divisions   = ['A','B','C','D','E'];
  readonly bloodGroups = ['A+','A−','B+','B−','AB+','AB−','O+','O−'];
  readonly relations   = ['Father','Mother','Guardian','Sibling','Other'];

  readonly form: FormGroup;

  private readonly uid: string | null;

  readonly steps = ['Personal', 'Academic', 'Contact', 'Address'];
  readonly currentStep = signal(0);

  constructor(
    private readonly fb:         FormBuilder,
    private readonly apiStudent: ApiStudent,
    private readonly toast:      ToastService,
    private readonly route:      ActivatedRoute,
    private readonly router:     Router,
  ) {
    this.uid  = this.route.snapshot.paramMap.get('uid');
    this.form = this.buildForm();
  }

  ngOnInit(): void {
    this.loadSchools();
  }

  get f() { return this.form.controls; }

  isStepValid(step: number): boolean {
    const groups: string[][] = [
      ['firstName', 'lastName', 'birthDate', 'bloodGroup'],
      ['classLevel', 'division', 'schoolId'],
      ['mobileNumber', 'emailId', 'password',
       'emergencyContactName', 'emergencyContactNumber', 'emergencyContactRelation'],
      ['addressLineOne', 'city', 'state', 'country'],
    ];
    return groups[step].every(c => this.form.get(c)?.valid);
  }

  nextStep(): void {
    if (this.isStepValid(this.currentStep())) {
      this.currentStep.update(s => Math.min(s + 1, this.steps.length - 1));
    } else {
      this.markStepTouched(this.currentStep());
    }
  }

  prevStep(): void {
    this.currentStep.update(s => Math.max(s - 1, 0));
  }

  onSubmit(): void {
    if (this.form.invalid || !this.uid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const payload = { ...this.form.value, uid: this.uid };

    this.apiStudent.registerStudent(payload).subscribe({
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

  private buildForm(): FormGroup {
    return this.fb.group({
      firstName:  ['', Validators.required],
      middleName: [''],
      lastName:   ['', Validators.required],
      birthDate:  ['', Validators.required],
      bloodGroup: [''],

      classLevel: ['', Validators.required],
      division:   ['', Validators.required],
      schoolId:   [null, Validators.required],

      mobileNumber:             ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      emailId:                  ['', [Validators.required, Validators.email]],
      password:                 ['', [Validators.required, Validators.minLength(8)]],
      emergencyContactName:     ['', Validators.required],
      emergencyContactNumber:   ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      emergencyContactRelation: ['', Validators.required],
      alternateNumber:          [''],

      addressLineOne: ['', Validators.required],
      addressLineTwo: [''],
      city:           ['', Validators.required],
      pinCode:        [''],
      state:          ['', Validators.required],
      country:        ['', Validators.required],
    });
  }

  private loadSchools(): void {
    this.apiStudent.getSchoolsList().subscribe({
      next:  schools => this.schools.set(schools),
      error: ()      => this.toast.error('Could not load school list.'),
    });
  }

  private markStepTouched(step: number): void {
    const groups: string[][] = [
      ['firstName', 'lastName', 'birthDate'],
      ['classLevel', 'division', 'schoolId'],
      ['mobileNumber', 'emailId', 'password',
       'emergencyContactName', 'emergencyContactNumber', 'emergencyContactRelation'],
      ['addressLineOne', 'city', 'state', 'country'],
    ];
    groups[step].forEach(c => this.form.get(c)?.markAsTouched());
  }
}