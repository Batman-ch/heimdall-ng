import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItShell } from './it-shell';

describe('ItShell', () => {
  let component: ItShell;
  let fixture: ComponentFixture<ItShell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItShell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItShell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
