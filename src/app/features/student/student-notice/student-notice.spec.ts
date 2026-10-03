import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentNotice } from './student-notice';

describe('StudentNotice', () => {
  let component: StudentNotice;
  let fixture: ComponentFixture<StudentNotice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentNotice],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentNotice);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
