import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinanceShell } from './finance-shell';

describe('FinanceShell', () => {
  let component: FinanceShell;
  let fixture: ComponentFixture<FinanceShell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinanceShell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinanceShell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
