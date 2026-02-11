import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { API_BASE_URL, API_PREFIX } from '../../../../../core/tokens/api-base-url.token';
import { InvoicesService, InvoiceFile } from '../../../../../core/services/invoices.service';

@Component({
  selector: 'app-invoice-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon>description</mat-icon>
        Detalle de factura
      </h2>
      <button mat-icon-button (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
          <p>Cargando detalle...</p>
        </div>
      } @else if (errorMsg()) {
        <div class="error-container">
          <mat-icon>error</mat-icon>
          <p>{{ errorMsg() }}</p>
        </div>
      } @else if (invoice()) {
        <div class="invoice-detail">
          <div class="header-actions">
            <div class="file-name">
              <mat-icon>picture_as_pdf</mat-icon>
              <div>
                <div class="name">{{ invoice()!.file_name }}</div>
                <div class="meta">ID #{{ invoice()!.id }} · {{ formatSize(invoice()!.size) }}</div>
              </div>
            </div>
            <button mat-stroked-button color="primary" (click)="openPdf()">
              <mat-icon>open_in_new</mat-icon>
              Ver PDF
            </button>
          </div>

          <div class="status-row">
            <mat-chip [class]="statusClass(invoice()!.status)">
              {{ statusLabel(invoice()!.status) }}
            </mat-chip>
            <div class="paths">
              <div><strong>Origen:</strong> {{ invoice()!.original_path }}</div>
              <div><strong>Destino:</strong> {{ invoice()!.destination_path }}</div>
            </div>
          </div>

          <mat-divider></mat-divider>

          <div class="info-grid">
            <div class="info-item">
              <label>Codigo</label>
              <span>{{ invoice()!.code || '-' }}</span>
            </div>
            <div class="info-item">
              <label>Categoria</label>
              <span>{{ invoice()!.category || '-' }}</span>
            </div>
            <div class="info-item">
              <label>Procesada</label>
              <span>{{ formatDate(invoice()!.processed_at) }}</span>
            </div>
            <div class="info-item">
              <label>Creada</label>
              <span>{{ formatDate(invoice()!.created_at) }}</span>
            </div>
          </div>

          <div class="text-section">
            <h3>
              <mat-icon>article</mat-icon>
              Texto extraido
            </h3>
            <p class="excerpt">{{ invoice()!.excerpt || 'Sin extracto disponible' }}</p>

            @if (!includeText()) {
              <button mat-stroked-button (click)="loadInvoice(true)">
                Cargar texto completo
              </button>
            } @else {
              <pre class="full-text">{{ invoice()!.text || 'Sin texto completo' }}</pre>
            }
          </div>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-soft);

      h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;

        mat-icon {
          color: var(--brand-primary);
        }
      }
    }

    mat-dialog-content {
      padding: 0 !important;
      max-height: 75vh;
    }

    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      gap: 16px;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--text-muted);
      }

      p {
        color: var(--text-muted);
        margin: 0;
      }
    }

    .invoice-detail {
      padding: 24px;
    }

    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;

      .file-name {
        display: flex;
        align-items: center;
        gap: 12px;

        mat-icon {
          color: #d32f2f;
          font-size: 32px;
          width: 32px;
          height: 32px;
        }

        .name {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-strong);
        }

        .meta {
          color: var(--text-muted);
          font-size: 13px;
        }
      }
    }

    .status-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;

      .paths {
        color: var(--text-muted);
        font-size: 13px;

        strong {
          color: var(--text-strong);
        }
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin: 20px 0;

      .info-item {
        label {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        span {
          display: block;
          font-size: 15px;
          color: var(--text-strong);
        }
      }
    }

    .text-section {
      h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 12px;
        font-size: 18px;
        color: var(--text-strong);

        mat-icon {
          color: var(--brand-primary);
        }
      }

      .excerpt {
        background: var(--bg-app);
        padding: 12px 16px;
        border-radius: 8px;
        color: var(--text-normal);
        margin-bottom: 12px;
      }

      .full-text {
        background: var(--bg-app);
        padding: 16px;
        border-radius: 8px;
        max-height: 260px;
        overflow: auto;
        white-space: pre-wrap;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: var(--text-normal);
      }
    }

    .status-pending {
      background: #fff3e0;
      color: #e65100;
    }

    .status-moved {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status-exists {
      background: #e3f2fd;
      color: #1565c0;
    }

    .status-error {
      background: #ffebee;
      color: #c62828;
    }

    @media (max-width: 900px) {
      .header-actions {
        flex-direction: column;
        align-items: flex-start;
      }

      .status-row {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class InvoiceDetailDialogComponent implements OnInit {
  private invoicesService = inject(InvoicesService);
  private dialogRef = inject(MatDialogRef<InvoiceDetailDialogComponent>);
  private apiBaseUrl = inject(API_BASE_URL);
  private apiPrefix = inject(API_PREFIX);
  private data = inject<{ id: number }>(MAT_DIALOG_DATA);

  loading = signal(true);
  errorMsg = signal<string | null>(null);
  invoice = signal<InvoiceFile | null>(null);
  includeText = signal(false);

  ngOnInit(): void {
    this.loadInvoice(false);
  }

  loadInvoice(includeText: boolean): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.includeText.set(includeText);

    this.invoicesService.getInvoice(this.data.id, includeText).subscribe({
      next: (response) => {
        this.invoice.set(response);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.message || 'No se pudo cargar el detalle');
        this.loading.set(false);
      }
    });
  }

  openPdf(): void {
    const url = this.buildPdfUrl(this.data.id);
    window.open(url, '_blank');
  }

  close(): void {
    this.dialogRef.close();
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  private buildPdfUrl(id: number): string {
    const join = (...parts: string[]) =>
      parts
        .filter(Boolean)
        .map((p, i) => (i === 0 ? p.replace(/\/+$/,'') : p.replace(/^\/+|\/+$/g,'')))
        .join('/');

    return join(this.apiBaseUrl, this.apiPrefix, `invoices/${id}/view`);
  }
}
