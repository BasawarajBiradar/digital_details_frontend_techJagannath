import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendenceDetailsPage } from './attendence-details-page';

describe('AttendenceDetailsPage', () => {
  let component: AttendenceDetailsPage;
  let fixture: ComponentFixture<AttendenceDetailsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendenceDetailsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AttendenceDetailsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
