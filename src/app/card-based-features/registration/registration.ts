import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  selector: 'app-card-registration',
    imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './registration.html',
  styleUrl: './registration.scss',
})
export class Registration {
  selectedCard: string | null = null;
  commonForm: FormGroup;
  formSaved = false;
  isSaving = false;
  saveError: string | null = null;
  userId: number | null = null;

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
    private profileApi: ProfileApiService,
    private route: ActivatedRoute
  ) {
    this.commonForm = this.fb.group({
      firstName:               ['', Validators.required],
      lastName:                ['', Validators.required],
      password:                 ['', Validators.required],
      confirm_password:         ['', Validators.required],
      emailId:                    ['', [Validators.required, Validators.email]],
      phoneNumber:   ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      alternateNumber: [''],
      addressLineOne:            ['', Validators.required],
      addressLineTwo:            [''],
      city:                     ['', Validators.required],
      state:                    ['', Validators.required],
      country:                  ['', Validators.required],
      pincode:                  ['', [Validators.required, Validators.pattern(/^[0-9]{4,10}$/)]],
      safetyNote:           [''],
      medicalNote:             [''],
    }, { validators: Registration.passwordMatchValidator() });

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

    if (!this.selectedCard) return;
    // this.formState.save(this.commonForm.value);
    const uid = this.route.snapshot.paramMap.get('uid');
    this.router.navigate(['/setup-profile', uid, this.selectedCard, this.userId]);
  }


  save() {
    if (this.commonForm.invalid) {
      this.commonForm.markAllAsTouched();
      return;
    }
    this.formState.save(this.commonForm.value); 
    this.formSaved = true;    

  const uid = this.route.snapshot.paramMap.get('uid');
  this.profileApi.validateUserDetails(uid, this.commonForm.value).subscribe({
        next: (response) => {
          const userId = response.data.userId;
          this.userId = userId;
        },
        error: (err) => {
          console.error('user validation failed', err);
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
