import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JohnDeerePaymentsComponent } from './john-deere-payments';
import { JohnDeereService } from '../../../../core/services/john-deere.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

describe('JohnDeerePaymentsComponent', () => {
  let component: JohnDeerePaymentsComponent;
  let fixture: ComponentFixture<JohnDeerePaymentsComponent>;
  let mockJdService: jasmine.SpyObj<JohnDeereService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    mockJdService = jasmine.createSpyObj('JohnDeereService', ['listRecibos', 'getStats', 'deleteRecibo']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [JohnDeerePaymentsComponent],
      providers: [
        { provide: JohnDeereService, useValue: mockJdService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(JohnDeerePaymentsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    mockJdService.listRecibos.and.returnValue(of({ success: true, data: [] }));
    mockJdService.getStats.and.returnValue(of({ success: true, data: { total_recibos: 0, total_ordenes: 0, suma_dolares: 0, suma_pesos: 0 } }));
    
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
