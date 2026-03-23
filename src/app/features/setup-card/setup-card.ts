import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormStateService } from '@core/services/form-state';

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
    private formState: FormStateService
  ) {
    this.commonForm = this.fb.group({
      display_name:             ['', Validators.required],
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
  }
}