import { TestBed } from '@angular/core/testing';

import { FormState } from './form-state';

describe('FormState', () => {
  let service: FormState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
