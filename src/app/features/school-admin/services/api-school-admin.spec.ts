import { TestBed } from '@angular/core/testing';

import { ApiSchoolAdmin } from './api-school-admin';

describe('ApiSchoolAdmin', () => {
  let service: ApiSchoolAdmin;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiSchoolAdmin);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
