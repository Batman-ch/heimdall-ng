import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { JohnDeereService, JohnDeereRecibo, JohnDeereStats } from '../../../../core/services/john-deere.service';
import { UploadPdfDialogComponent } from './upload-pdf-dialog/upload-pdf-dialog';
import { ReciboDetailDialogComponent } from './recibo-detail-dialog/recibo-detail-dialog';

@Component({
  selector: 'app-john-deere-payments',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule
  ],
  templateUrl: './john-deere-payments.html',
  styleUrls: ['./john-deere-payments.scss']
})
export class JohnDeerePaymentsComponent implements OnInit {
  private jdService = inject(JohnDeereService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  // Estado
  loading = signal(false);
  loadingStats = signal(false);
  recibos = signal<JohnDeereRecibo[]>([]);
  stats = signal<JohnDeereStats | null>(null);
  filtersForm = new FormGroup({
    query: new FormControl(''),
    filter_recibo: new FormControl(true),
    filter_cheque: new FormControl(true),
    filter_concesionario: new FormControl(true),
    filter_ordenes: new FormControl(false)
  });

  filterValues = signal(this.buildFilterSnapshot());

  // Columnas de la tabla
  displayedColumns = ['recibo_numero', 'fecha_recibo', 'cheque_numero', 'concesionario_numero', 'ordenes_count', 'total_recibo', 'actions'];

  // Totales computados
  totalRecibos = computed(() => this.recibos().length);
  totalOrdenes = computed(() => this.recibos().reduce((sum, r) => sum + (r.ordenes_count || 0), 0));
  filteredRecibos = computed(() => this.applyFilters(this.recibos(), this.filterValues()));

  ngOnInit(): void {
    this.loadRecibos();
    this.loadStats();
    this.filtersForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.filterValues.set(this.buildFilterSnapshot()));
  }

  clearFilters(): void {
    this.filtersForm.reset({
      query: '',
      filter_recibo: true,
      filter_cheque: true,
      filter_concesionario: true,
      filter_ordenes: false
    });
    this.filterValues.set(this.buildFilterSnapshot());
  }

  loadRecibos(): void {
    this.loading.set(true);
    this.jdService.listRecibos().subscribe({
      next: (response) => {
        console.log('Respuesta listRecibos:', response);
        if (response.success && response.data) {
          console.log('Recibos recibidos:', response.data);
          this.recibos.set(response.data);
        } else {
          this.showError(response.error || 'Error al cargar recibos');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar recibos:', err);
        this.showError('Error de conexión al cargar recibos');
        this.loading.set(false);
      }
    });
  }

  loadStats(): void {
    this.loadingStats.set(true);
    this.jdService.getStats().subscribe({
      next: (response) => {
        console.log('Respuesta getStats:', response);
        if (response.success && response.data) {
          this.stats.set(response.data);
        }
        this.loadingStats.set(false);
      },
      error: () => {
        this.loadingStats.set(false);
      }
    });
  }

  openUploadDialog(): void {
    const dialogRef = this.dialog.open(UploadPdfDialogComponent, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((uploaded: boolean) => {
      if (uploaded) {
        this.loadRecibos();
        this.loadStats();
      }
    });
  }

  openReciboDetail(recibo: JohnDeereRecibo): void {
    this.dialog.open(ReciboDetailDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      data: { reciboNumero: recibo.recibo_numero },
      panelClass: 'recibo-detail-dialog'
    });
  }

  deleteRecibo(recibo: JohnDeereRecibo, event: Event): void {
    event.stopPropagation();
    
    if (!confirm(`¿Eliminar el recibo ${recibo.recibo_numero} y todas sus ${recibo.ordenes_count} órdenes?`)) {
      return;
    }

    this.jdService.deleteRecibo(recibo.recibo_numero).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess(response.message || 'Recibo eliminado correctamente');
          this.loadRecibos();
          this.loadStats();
        } else {
          this.showError(response.error || 'Error al eliminar recibo');
        }
      },
      error: () => {
        this.showError('Error de conexión al eliminar recibo');
      }
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  formatCurrency(value: number | string | null | undefined): string {
    if (value === null || value === undefined) {
      return '$ 0,00';
    }
    // Parsear si es string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) {
      return '$ 0,00';
    }
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(numValue);
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return 'N/A';
    }
    // Laravel puede devolver timestamps completos, solo parseamos directamente
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }

  private buildFilterSnapshot() {
    if (!this.filtersForm) {
      return {
        query: '',
        filter_recibo: true,
        filter_cheque: true,
        filter_concesionario: true,
        filter_ordenes: false
      };
    }

    const value = this.filtersForm.getRawValue();
    return {
      query: value.query?.trim() || '',
      filter_recibo: !!value.filter_recibo,
      filter_cheque: !!value.filter_cheque,
      filter_concesionario: !!value.filter_concesionario,
      filter_ordenes: !!value.filter_ordenes
    };
  }

  private applyFilters(recibos: JohnDeereRecibo[], filters: ReturnType<JohnDeerePaymentsComponent['buildFilterSnapshot']>) {
    if (!filters) return recibos;

    return recibos.filter(recibo => {
      const query = filters.query?.toLowerCase();
      if (!query) return true;

      const checks: boolean[] = [];
      if (filters.filter_recibo) {
        checks.push(this.matches(recibo.recibo_numero, query));
      }
      if (filters.filter_cheque) {
        checks.push(this.matches(recibo.cheque_numero, query));
      }
      if (filters.filter_concesionario) {
        checks.push(this.matches(recibo.concesionario_numero, query));
      }
      if (filters.filter_ordenes) {
        checks.push(this.matches(recibo.ordenes_count, query));
      }

      if (checks.length === 0) {
        return true;
      }

      return checks.some(Boolean);
    });
  }

  private matches(value: string | number | null | undefined, query: string): boolean {
    if (!value) return false;
    return String(value).toLowerCase().includes(query.toLowerCase());
  }

}
