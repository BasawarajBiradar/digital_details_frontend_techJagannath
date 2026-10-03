import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoticeManagement } from './notice-management';

describe('NoticeManagement', () => {
  let component: NoticeManagement;
  let fixture: ComponentFixture<NoticeManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoticeManagement],
    }).compileComponents();

    fixture = TestBed.createComponent(NoticeManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
