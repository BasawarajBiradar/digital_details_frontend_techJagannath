import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideRouter } from '@angular/router';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { DashboardFooter } from './dashboard-footer';

describe('DashboardFooter', () => {
  let component: DashboardFooter;
  let fixture: ComponentFixture<DashboardFooter>;

  beforeAll(() => {
    TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardFooter],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardFooter);
    component = fixture.componentInstance;
  });

  it('should hide homework for school-admin users', () => {
    fixture.componentRef.setInput('role', 'school-admin');
    fixture.detectChanges();

    expect(component.options().some(option => option.label === 'Homework')).toBeFalse();
  });
});
