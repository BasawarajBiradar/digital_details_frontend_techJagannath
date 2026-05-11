import { TestBed } from '@angular/core/testing';

import { ApiStudent } from './api-student';

describe('ApiStudent', () => {
  let service: ApiStudent;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiStudent);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
