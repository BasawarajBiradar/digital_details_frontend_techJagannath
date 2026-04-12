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
import { HttpClient } from '@angular/common/http';

export type AccountType = 'kids' | 'senior' | 'business' | 'vehicle' | 'pets' | 'social';

@Component({
  selector: 'app-registration',
  standalone: true,
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
  templateUrl: './registration.html',
  styleUrl: './registration.scss'
})
export class RegistrationComponent implements OnInit {
  accountType!: AccountType;
  form!: FormGroup;
  isLoading = false;

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
    private http: HttpClient 
  ) {}

  ngOnInit() {
    this.accountType = this.route.snapshot.paramMap.get('type') as AccountType;
    this.form = this.buildForm();
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
      child_name:         ['', Validators.required],
      date_of_birth:      ['', Validators.required],
      gender:             ['', Validators.required],
      blood_group:        [''],
      school_name:        [''],
      school_address:     [''],
      allergies:          [''],
      medical_conditions: [''],
      guardians: this.fb.array([this.newGuardian()])
    });
  }

  private buildSeniorForm(): FormGroup {
    return this.fb.group({
      full_name:            ['', Validators.required],
      date_of_birth:        ['', Validators.required],
      gender:               ['', Validators.required],
      blood_group:          [''],
      medical_conditions:   [''],
      medications:          [''],
      doctor_name:          [''],
      doctor_contact:       [''],
      hospital_preference:  [''],
      insurance_provider:   [''],
      insurance_number:     [''],
      caretakers: this.fb.array([this.newCaretaker()])
    });
  }

  private buildBusinessForm(): FormGroup {
    return this.fb.group({
      business_name:        ['', Validators.required],
      business_type:        ['', Validators.required],
      registration_number:  [''],
      gst_number:           [''],
      business_email:       ['', Validators.email],
      business_phone:       [''],
      website_url:          [''],
      business_address:     [''],
      owner_name:           ['', Validators.required],
      owner_contact:        [''],
      owner_email:          ['', Validators.email],
    });
  }

  private buildVehicleForm(): FormGroup {
    return this.fb.group({
      vehicle_number:       ['', Validators.required],
      vehicle_type:         ['', Validators.required],
      brand:                [''],
      model:                [''],
      color:                [''],
      year_of_manufacture:  [''],
      owner_name:           ['', Validators.required],
      owner_contact:        ['', Validators.required],
      alternate_contact:    [''],
      rc_number:            [''],
      insurance_number:     [''],
      insurance_expiry:     [''],
      chassis_number:       [''],
    });
  }

  private buildPetsForm(): FormGroup {
    return this.fb.group({
      pet_name:             ['', Validators.required],
      species:              ['', Validators.required],
      breed:                [''],
      gender:               [''],
      age:                  [''],
      color:                [''],
      microchip_id:         [''],
      vaccination_status:   [''],
      vet_name:             [''],
      vet_contact:          [''],
      medical_notes:        [''],
      owner_name:           ['', Validators.required],
      owner_contact:        ['', Validators.required],
      alternate_contact:    [''],
    });
  }

  private buildSocialForm(): FormGroup {
    return this.fb.group({
      full_name:                  ['', Validators.required],
      nickname:                   [''],
      instagram_handle:           [''],
      facebook_profile:           [''],
      linkedin_profile:           [''],
      twitter_handle:             [''],
      emergency_contact_name:     ['', Validators.required],
      emergency_contact_number:   ['', Validators.required],
      message_to_finder:          [''],
    });
  }

  // ── Dynamic FormArrays ─────────────────────────────────────────────
  private newGuardian(): FormGroup {
    return this.fb.group({
      guardian_name:    ['', Validators.required],
      relationship:     ['', Validators.required],
      primary_phone:    ['', Validators.required],
      alternate_phone:  [''],
      email:            ['', Validators.email],
      address:          [''],
      is_primary:       [false],
      id_proof_type:    [''],
      id_proof_number:  [''],
    });
  }

  private newCaretaker(): FormGroup {
    return this.fb.group({
      caretaker_name:   ['', Validators.required],
      relationship:     [''],
      phone:            ['', Validators.required],
      alternate_phone:  [''],
      address:          [''],
      is_primary:       [false],
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

  // ── Submit ─────────────────────────────────────────────────────────
  onSubmit() {
    if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
      }
      this.isLoading = true;

      const payload = { account_type: this.accountType, ...this.form.value };
      const endpoint = `save/profile-details/${this.accountType}`;

      this.http.post(endpoint, payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Registration failed', err);
        }
      });
  }

  get config() { return this.typeConfig[this.accountType]; }
}