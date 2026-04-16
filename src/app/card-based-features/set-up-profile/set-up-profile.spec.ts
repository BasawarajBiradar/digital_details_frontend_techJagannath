import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetUpProfile } from './set-up-profile';

describe('SetUpProfile', () => {
  let component: SetUpProfile;
  let fixture: ComponentFixture<SetUpProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetUpProfile],
    }).compileComponents();

    fixture = TestBed.createComponent(SetUpProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
