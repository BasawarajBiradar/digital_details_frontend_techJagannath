import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ProfileApiService } from '@core/services/profile-api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;

  constructor(private fb: FormBuilder, private router: Router, private profileApi: ProfileApiService) {
    this.loginForm = this.fb.group({
      emailId: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  get emailId() { return this.loginForm.get('emailId')!; }
  get password() { return this.loginForm.get('password')!; }

  onSubmit() {
   if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }
  this.isLoading = true;

  this.profileApi.login(this.loginForm.value).subscribe({
    next: (res) => {
      localStorage.setItem('token', res.data.token);
      this.isLoading = false;
      this.router.navigate(['/home-page']);
    },
    error: (err) => {
      this.isLoading = false;
      // show error to user
    }
  });
  }
}