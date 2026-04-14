import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface CommonProfilePayload {
  firstName: string;
  lastName: string;
  emailId: string;
  phoneNumber: string;
  alternateNumber: string;
  addressLineOne: string;
  addressLineTwo: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  safetyNote: string;
  medicalNote: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  saveCommonProfile(payload: CommonProfilePayload): Observable<{ data: { userId: number } }> {
    return this.http.post<{ data: { userId: number } }>(`${this.baseUrl}/api/user-management/register`, payload);
  }

  saveProfileDetails(userId: number, accountType: string, payload: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/user-management/save/${userId}/${accountType}`, payload
    );
  }

}