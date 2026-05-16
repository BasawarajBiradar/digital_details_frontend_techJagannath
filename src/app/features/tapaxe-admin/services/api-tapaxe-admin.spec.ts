import { TestBed } from '@angular/core/testing';

import { ApiTapaxeAdmin } from './api-tapaxe-admin';

describe('ApiTapaxeAdmin', () => {
  let service: ApiTapaxeAdmin;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiTapaxeAdmin);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
