import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { API_BASE_URL, API_PREFIX } from '../../../../core/tokens/api-base-url.token';
import {
  InvoicesService,
  InvoiceFile,
  InvoiceMeta,
  InvoiceSummary,
  InvoiceProcessingStatus
} from '../../../../core/services/invoices.service';
import { InvoiceDetailDialogComponent } from './invoice-detail-dialog/invoice-detail-dialog';
import { UploadInvoicesDialogComponent } from './upload-invoices-dialog';

@Component({
  selector: 'app-john-deere-invoices',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule
  ],
  templateUrl: './john-deere-invoices.html',
  styleUrls: ['./john-deere-invoices.scss']
})
export class JohnDeereInvoicesComponent implements OnInit {
  private invoicesService = inject(InvoicesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private apiBaseUrl = inject(API_BASE_URL);
  private apiPrefix = inject(API_PREFIX);

  loading = signal(false);
  loadingSummary = signal(false);
  invoices = signal<InvoiceFile[]>([]);
  meta = signal<InvoiceMeta | null>(null);
  summary = signal<InvoiceSummary | null>(null);

  processLoading = signal(false);
  processStatus = signal<InvoiceProcessingStatus | null>(null);
  processError = signal<string | null>(null);

  pageIndex = signal(0);
  pageSize = signal(25);

  displayedColumns = ['file_name', 'code', 'category', 'status', 'processed_at', 'size', 'actions'];

  filtersForm = new FormGroup({
    q: new FormControl(''),
    file_name: new FormControl(''),
    code: new FormControl(''),
    category: new FormControl(''),
    status: new FormControl(''),
    date_from: new FormControl<Date | null>(null),
    date_to: new FormControl<Date | null>(null)
  });

  processId = new FormControl('');

  statusCounts = computed(() => this.summary()?.by_status || {});
  categoryCounts = computed(() => this.summary()?.by_category || {});

  ngOnInit(): void {
    this.loadSummary();
    this.loadInvoices(true);
  }

  loadSummary(): void {
    this.loadingSummary.set(true);
    this.invoicesService.getSummary().subscribe({
      next: (response) => {
        this.summary.set(response);
        this.loadingSummary.set(false);
      },
      error: () => {
        this.loadingSummary.set(false);
      }
    });
  }

  loadInvoices(resetPage = false): void {
    if (resetPage) {
      this.pageIndex.set(0);
    }

    const formValue = this.filtersForm.getRawValue();
    const dateFrom = this.formatDateForApi(formValue.date_from);
    const dateTo = this.formatDateForApi(formValue.date_to);

    this.loading.set(true);
    this.invoicesService.searchInvoices({
      q: formValue.q || undefined,
      file_name: formValue.file_name || undefined,
      code: formValue.code || undefined,
      category: formValue.category || undefined,
      status: formValue.status || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: this.pageIndex() + 1,
      per_page: this.pageSize(),
      sort_by: 'processed_at',
      sort_dir: 'desc'
    }).subscribe({
      next: (response) => {
        this.invoices.set(response.data || []);
        this.meta.set(response.meta || null);
        this.loading.set(false);
      },
      error: () => {
        this.showError('Error al cargar facturas');
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    this.loadInvoices(true);
  }

  clearFilters(): void {
    this.filtersForm.reset();
    this.loadInvoices(true);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadInvoices();
  }

  refreshAll(): void {
    this.loadSummary();
    this.loadInvoices();
  }

  openUploadDialog(): void {
    const dialogRef = this.dialog.open(UploadInvoicesDialogComponent, {
      width: '540px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result?: { uploaded: boolean; jobId?: number }) => {
      if (result?.uploaded) {
        this.refreshAll();
        if (result.jobId) {
          this.processId.setValue(String(result.jobId));
          this.checkProcessStatus();
        }
      }
    });
  }

  openDetail(invoice: InvoiceFile): void {
    this.dialog.open(InvoiceDetailDialogComponent, {
      width: '90vw',
      maxWidth: '1100px',
      data: { id: invoice.id },
      panelClass: 'invoice-detail-dialog'
    });
  }

  openPdf(invoice: InvoiceFile, event: Event): void {
    event.stopPropagation();
    const url = this.buildPdfUrl(invoice.id);
    window.open(url, '_blank');
  }

  checkProcessStatus(): void {
    const idValue = this.processId.value?.trim();
    if (!idValue || isNaN(Number(idValue))) {
      this.processError.set('Ingresa un ID de proceso valido');
      this.processStatus.set(null);
      return;
    }

    this.processLoading.set(true);
    this.processError.set(null);

    this.invoicesService.getProcessingStatus(Number(idValue)).subscribe({
      next: (response) => {
        this.processStatus.set(response);
        this.processLoading.set(false);
      },
      error: (err) => {
        this.processStatus.set(null);
        this.processError.set(err?.error?.message || 'No se pudo obtener el estado');
        this.processLoading.set(false);
      }
    });
  }

  statusLabel(status: InvoiceFile['status']): string {
    switch (status) {
      case 'moved':
        return 'Movida';
      case 'pending':
        return 'Pendiente';
      case 'exists':
        return 'Duplicada';
      case 'error':
        return 'Error';
      default:
        return status;
    }
  }

  statusClass(status: InvoiceFile['status']): string {
    return `status-${status}`;
  }

  formatSize(bytes: number): string {
    if (!bytes && bytes !== 0) {
      return '-';
    }
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return 'N/A';
    }
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

  private formatDateForApi(date: Date | null): string | null {
    if (!date) {
      return null;
    }
    return formatDate(date, 'yyyy-MM-dd', 'en-US');
  }

  private buildPdfUrl(id: number): string {
    const join = (...parts: string[]) =>
      parts
        .filter(Boolean)
        .map((p, i) => (i === 0 ? p.replace(/\/+$/,'') : p.replace(/^\/+|\/+$/g,'')))
        .join('/');

    return join(this.apiBaseUrl, this.apiPrefix, `invoices/${id}/view`);
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
