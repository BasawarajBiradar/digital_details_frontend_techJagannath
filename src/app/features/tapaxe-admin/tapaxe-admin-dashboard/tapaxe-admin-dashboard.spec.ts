import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TapaxeAdminDashboard } from './tapaxe-admin-dashboard';

describe('TapaxeAdminDashboard', () => {
  let component: TapaxeAdminDashboard;
  let fixture: ComponentFixture<TapaxeAdminDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TapaxeAdminDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(TapaxeAdminDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
