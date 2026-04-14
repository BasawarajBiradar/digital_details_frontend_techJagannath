import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormStateService } from '@core/services/form-state';
import { ProfileApiService, CommonProfilePayload } from '@core/services/profile-api';

interface CardType {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-setup-card',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './setup-card.html',
  styleUrl: './setup-card.scss'
})
export class SetupCardComponent {
  selectedCard: string | null = null;
  commonForm: FormGroup;
  formSaved = false;
  isSaving = false;
  saveError: string | null = null;

  cards: CardType[] = [
    { id: 'kids',     emoji: '👶', title: 'Kids',     description: 'Emergency info for children'  },
    { id: 'senior',   emoji: '👴', title: 'Senior',   description: 'Medical & contact details'    },
    { id: 'pets',     emoji: '🐾', title: 'Pets',     description: 'Pet ID & owner info'          },
    { id: 'business', emoji: '💼', title: 'Business', description: 'Card, links & company'        },
    { id: 'vehicle',  emoji: '🚗', title: 'Vehicle',  description: 'Car info & owner contact'     },
    { id: 'social',   emoji: '🌐', title: 'Social',   description: 'All your social links'        },
  ];

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private formState: FormStateService,
    private profileApi: ProfileApiService
  ) {
    this.commonForm = this.fb.group({
      first_name:               ['', Validators.required],
      last_name:                ['', Validators.required],
      password:                 ['', Validators.required],
      confirm_password:         ['', Validators.required],
      email:                    ['', [Validators.required, Validators.email]],
      primary_contact_number:   ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      alternate_contact_number: [''],
      address_line1:            ['', Validators.required],
      address_line2:            [''],
      city:                     ['', Validators.required],
      state:                    ['', Validators.required],
      country:                  ['', Validators.required],
      pincode:                  ['', [Validators.required, Validators.pattern(/^[0-9]{4,10}$/)]],
      emergency_note:           [''],
      medical_note:             [''],
    }, { validators: SetupCardComponent.passwordMatchValidator() });

      this.commonForm.valueChanges.subscribe(() => {
      const confirmCtrl = this.commonForm.get('confirm_password');
      if (this.commonForm.hasError('passwordMismatch')) {
        confirmCtrl?.setErrors({ ...confirmCtrl.errors, passwordMismatch: true });
      } else {
        if (confirmCtrl?.hasError('passwordMismatch')) {
          const errors = { ...confirmCtrl.errors };
          delete errors['passwordMismatch'];
          confirmCtrl.setErrors(Object.keys(errors).length ? errors : null);
        }
      }
    });

    // Restore if user came back
    const saved = this.formState.commonFields();
    if (Object.keys(saved).length) {
      this.commonForm.patchValue(saved);
    }
  }

  select(card: CardType) {
    if (!this.formSaved) return; // block card selection until saved
    this.selectedCard = card.id;
  }

  continue() {
    if (this.commonForm.invalid) {
      this.commonForm.markAllAsTouched();
      return;
    }
    if (!this.selectedCard || !this.formSaved) return;
    this.router.navigate(['/register', this.selectedCard]);
  }


    save() {
    if (this.commonForm.invalid) {
      this.commonForm.markAllAsTouched();
      return;
    }
    this.formState.save(this.commonForm.value);
    this.formSaved = true;
    this.isSaving = true;
    this.saveError = null;
    const formValue = this.commonForm.value;

    // Map form field names → API field names
    const payload: CommonProfilePayload = {
      firstName:        formValue.first_name || '',
      lastName:         formValue.last_name || '',
      password:         formValue.password || '',
      confirmPassword:  formValue.confirm_password || '',
      emailId:          formValue.email,
      phoneNumber:      formValue.primary_contact_number,
      alternateNumber:  formValue.alternate_contact_number ?? '',
      addressLineOne:   formValue.address_line1,
      addressLineTwo:   formValue.address_line2 ?? '',
      city:             formValue.city,
      state:            formValue.state,
      country:          formValue.country,
      pinCode:          formValue.pincode,
      safetyNote:       formValue.emergency_note ?? '',
      medicalNote:      formValue.medical_note ?? '',
    };

    this.profileApi.saveCommonProfile(payload).subscribe({
      next: (res) => {                          
        this.formState.save(formValue);
        this.formState.setUserId(res.data.userId);   
        this.formSaved = true;
        this.isSaving = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isSaving = false;
        this.saveError = 'Failed to save details. Please try again.';
        console.error('Save failed:', err);
      }
    });
    
  }

    private static passwordMatchValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const password = group.get('password')?.value;
      const confirm  = group.get('confirm_password')?.value;
      return password && confirm && password !== confirm
        ? { passwordMismatch: true }
        : null;
    };
  }

  
}