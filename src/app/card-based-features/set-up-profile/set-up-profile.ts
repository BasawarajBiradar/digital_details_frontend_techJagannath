import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { FormStateService } from '@core/services/form-state';
import { ProfileApiService } from '@core/services/profile-api';
import { ToastService } from '@core/services/toast-service';

export type AccountType = 'kids' | 'senior' | 'business' | 'vehicle' | 'pets' | 'social';

@Component({
  selector: 'app-set-up-profile',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './set-up-profile.html',
  styleUrl: './set-up-profile.scss',
})
export class SetUpProfile {
 accountType!: AccountType;
  form!: FormGroup;
  isLoading = false;
  uid: string | null = null;

  // Meta config per account type
  readonly typeConfig: Record<AccountType, { title: string; subtitle: string; emoji: string }> = {
    kids:     { title: 'Child Profile',    subtitle: 'Emergency info for children',   emoji: '👶' },
    senior:   { title: 'Senior Profile',   subtitle: 'Medical & contact details',     emoji: '👴' },
    business: { title: 'Business Profile', subtitle: 'Card, links & company info',    emoji: '💼' },
    vehicle:  { title: 'Vehicle Profile',  subtitle: 'Car info & owner contact',      emoji: '🚗' },
    pets:     { title: 'Pet Profile',      subtitle: 'Pet ID & owner info',           emoji: '🐾' },
    social:   { title: 'Social Profile',   subtitle: 'Your social identity card',     emoji: '🌐' },
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private formState: FormStateService,
  private profileApi: ProfileApiService,
      private toast: ToastService
    
  ) {}

  ngOnInit() {
    this.accountType = this.route.snapshot.paramMap.get('type') as AccountType;
    this.uid = this.route.snapshot.paramMap.get('uid');
    this.form = this.buildForm();
    console.log('userId on registration load:', this.formState.getUserId()); 
    const saved = this.formState.commonFields();
    if (Object.keys(saved).length) {
      this.form.patchValue(saved);
    }
  }

  // ── Build form based on account type ──────────────────────────────
  private buildForm(): FormGroup {
    switch (this.accountType) {
      case 'kids':     return this.buildKidsForm();
      case 'senior':   return this.buildSeniorForm();
      case 'business': return this.buildBusinessForm();
      case 'vehicle':  return this.buildVehicleForm();
      case 'pets':     return this.buildPetsForm();
      case 'social':   return this.buildSocialForm();
    }
  }

  private buildKidsForm(): FormGroup {
    return this.fb.group({
      childName:         ['', Validators.required],
      dateOfBirth:      ['', Validators.required],
      gender:             ['', Validators.required],
      bloodGroup:        [''],
      schoolName:        [''],
      schoolAddress:     [''],
      allergies:          [''],
      medicalConditions: [''],
      guardians: this.fb.array([this.newGuardian()])
    });
  }

  private buildSeniorForm(): FormGroup {
    return this.fb.group({
      fullName:            ['', Validators.required],
      dateOfBirth:        ['', Validators.required],
      gender:               ['', Validators.required],
      bloodGroup:          [''],
      medicalConditions:   [''],
      medications:          [''],
      doctorName:          [''],
      doctorContact:       [''],
      hospitalPreference:  [''],
      insuranceProvider:   [''],
      insuranceNumber:     [''],
      caretakers: this.fb.array([this.newCaretaker()])
    });
  }

  private buildBusinessForm(): FormGroup {
    return this.fb.group({
      businessName:        ['', Validators.required],
      businessType:        ['', Validators.required],
      registrationNumber:  [''],
      gstNumber:           [''],
      businessEmail:       ['', Validators.email],
      businessPhone:       [''],
      websiteUrl:          [''],
      businessAddress:     [''],
      ownerName:           ['', Validators.required],
      ownerContact:        [''],
      ownerEmail:          ['', Validators.email],
    });
  }

  private buildVehicleForm(): FormGroup {
    return this.fb.group({
      vehicleNumber:       ['', Validators.required],
      vehicleType:         ['', Validators.required],
      brand:                [''],
      model:                [''],
      color:                [''],
      yearOfManufacture:  [''],
      ownerName:           ['', Validators.required],
      ownerContact:        ['', Validators.required],
      alternateContact:    [''],
      rcNumber:            [''],
      insuranceNumber:     [''],
      insuranceExpiry:     [''],
      chassisNumber:       [''],
    });
  }

  private buildPetsForm(): FormGroup {
    return this.fb.group({
      petName:             ['', Validators.required],
      species:              ['', Validators.required],
      breed:                [''],
      gender:               [''],
      age:                  [''],
      color:                [''],
      microchipId:         [''],
      vaccinationStatus:   [''],
      vetName:             [''],
      vetContact:          [''],
      medicalNotes:        [''],
      ownerName:           ['', Validators.required],
      ownerContact:        ['', Validators.required],
      alternateContact:    [''],
    });
  }

  private buildSocialForm(): FormGroup {
    return this.fb.group({
      fullName:                  ['', Validators.required],
      nickname:                   [''],
      instagramHandle:           [''],
      facebookProfile:           [''],
      linkedinProfile:           [''],
      twitterHandle:             [''],
      emergencyContactName:     ['', Validators.required],
      emergencyContactNumber:   ['', Validators.required],
      messageToFinder:          [''],
    });
  }

  // ── Dynamic FormArrays ─────────────────────────────────────────────
  private newGuardian(): FormGroup {
    return this.fb.group({
      guardianName:    ['', Validators.required],
      relationship:     ['', Validators.required],
      primaryPhone:    ['', Validators.required],
      alternatePhone:  [''],
      email:            ['', Validators.email],
      address:          [''],
      isPrimary:       [false],
      idProofType:    [''],
      idProofNumber:  [''],
    });
  }

  private newCaretaker(): FormGroup {
    return this.fb.group({
      caretakerName:   ['', Validators.required],
      relationship:     [''],
      phone:            ['', Validators.required],
      alternatePhone:  [''],
      address:          [''],
      isPrimary:       [false],
    });
  }

  get guardians(): FormArray {
    return this.form.get('guardians') as FormArray;
  }

  get caretakers(): FormArray {
    return this.form.get('caretakers') as FormArray;
  }

  addGuardian()   { this.guardians.push(this.newGuardian()); }
  removeGuardian(i: number) { this.guardians.removeAt(i); }

  addCaretaker()  { this.caretakers.push(this.newCaretaker()); }
  removeCaretaker(i: number) { this.caretakers.removeAt(i); }

  onSubmit() {
    
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const userId = this.route.snapshot.paramMap.get('userId');

    this.isLoading = true;
    const payload = {
      userId: userId,
      ...this.form.value,
      account_type: this.accountType
    };

    this.profileApi.saveCardProfileDetails(this.accountType, payload, this.uid).subscribe({
      next: () => {
        this.isLoading = false;
        this.formState.clear();
        this.toast.success('Profile saved successfully!');
        this.router.navigate(['/card', this.uid]);
      },
      error: (err) => {
        const message = err?.error?.message || 'Something went wrong. Please try again.';
        this.toast.error(message);
        this.isLoading = false;
        console.error('Registration failed', err);
      }
    });
  }

  get config() { return this.typeConfig[this.accountType]; }

  goBack() {
    this.router.navigate(['/card', this.uid]);
  }
}