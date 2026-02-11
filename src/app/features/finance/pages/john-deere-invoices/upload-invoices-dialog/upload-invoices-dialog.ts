import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import {
  InvoicesService,
  InvoiceUploadResponse,
  InvoiceProcessResponse,
  InvoiceProcessingStatus
} from '../../../../../core/services/invoices.service';

@Component({
  selector: 'app-upload-invoices-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>upload_file</mat-icon>
      Subir facturas
    </h2>

    <mat-dialog-content>
      @if (!uploading() && !processing() && !completed()) {
        <div class="upload-area"
             [class.drag-over]="dragOver()"
             (click)="fileInput.click()"
             (drop)="onDrop($event)"
             (dragover)="onDragOver($event)"
             (dragleave)="onDragLeave()">
          <mat-icon>cloud_upload</mat-icon>
          <p><strong>Haz clic o arrastra</strong> tus PDFs aqui</p>
          <p class="hint">Maximo 10 MB por archivo</p>

          @if (selectedFiles().length) {
            <div class="selected-files">
              @for (file of selectedFiles(); track file.name) {
                <div class="file-chip">
                  <mat-icon>picture_as_pdf</mat-icon>
                  <span>{{ file.name }}</span>
                </div>
              }
            </div>
          }
        </div>

        <input #fileInput type="file" accept=".pdf" multiple
               (change)="onFileSelected($event)"
               style="display: none">

        @if (errorMsg()) {
          <div class="error-msg">
            <mat-icon>error</mat-icon>
            {{ errorMsg() }}
          </div>
        }
      }

      @if (uploading()) {
        <div class="uploading-state">
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          <p>{{ uploadStatus() }}</p>
        </div>
      }

      @if (processing()) {
        <div class="progress-section">
          <h3>Procesando archivos</h3>
          <div class="progress-bar-container">
            <div class="progress-bar" [style.width.%]="progress()"></div>
          </div>
          <p class="progress-text">{{ progress().toFixed(1) }}%</p>
          <p class="status-text">Estado: {{ statusText() }}</p>
          <p class="files-text">{{ processedFiles() }} de {{ totalFiles() }} archivos procesados</p>
          @if (currentFile()) {
            <p class="current-file">Procesando: {{ currentFile() }}</p>
          }
        </div>
      }

      @if (completed()) {
        <div class="success-msg">
          <mat-icon>check_circle</mat-icon>
          {{ successMsg() }}
        </div>
      }

      @if (failed()) {
        <div class="error-msg">
          <mat-icon>error</mat-icon>
          {{ errorMsg() }}
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()" [disabled]="uploading()">
        Cancelar
      </button>
      <button mat-raised-button color="primary"
              (click)="upload()"
              [disabled]="!selectedFiles().length || uploading()">
        <mat-icon>upload</mat-icon>
        Subir y procesar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;

      mat-icon {
        color: var(--brand-primary);
      }
    }

    mat-dialog-content {
      min-width: 420px;
      padding: 20px 24px !important;
    }

    .upload-area {
      border: 2px dashed var(--border-soft);
      border-radius: 8px;
      padding: 36px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      background: var(--bg-app);

      &:hover, &.drag-over {
        border-color: var(--brand-primary);
        background: var(--nav-hover-bg);
      }

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--text-muted);
        margin-bottom: 16px;
      }

      p {
        margin: 8px 0;
        color: var(--text-normal);

        &.hint {
          font-size: 13px;
          color: var(--text-muted);
        }
      }

      .selected-files {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 8px;
        margin-top: 16px;
      }

      .file-chip {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 6px;
        background: white;
        box-shadow: 0 1px 2px rgba(0,0,0,0.08);
        font-size: 13px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: #d32f2f;
          margin: 0;
        }
      }
    }

    .uploading-state {
      padding: 20px;
      text-align: center;

      mat-progress-bar {
        margin-bottom: 16px;
      }

      p {
        color: var(--text-muted);
        margin: 0;
      }
    }

    .progress-section {
      margin-top: 16px;

      h3 {
        margin: 0 0 12px;
        color: var(--text-strong);
      }

      .progress-bar-container {
        width: 100%;
        height: 24px;
        background: #e0e0e0;
        border-radius: 12px;
        overflow: hidden;
        margin: 12px 0;
      }

      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #4caf50, #8bc34a);
        transition: width 0.3s ease;
      }

      .progress-text {
        font-size: 20px;
        font-weight: 600;
        color: #4caf50;
        margin: 6px 0;
      }

      .status-text {
        font-size: 14px;
        color: var(--text-muted);
        margin: 0 0 6px;
      }

      .files-text {
        font-size: 14px;
        color: var(--text-normal);
        margin: 0 0 6px;
      }

      .current-file {
        font-size: 13px;
        color: var(--text-muted);
        font-style: italic;
        margin: 0;
      }
    }

    .error-msg, .success-msg {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 12px;
      border-radius: 6px;
      font-size: 14px;
    }

    .error-msg {
      background: #ffebee;
      color: #c62828;

      mat-icon {
        color: #c62828;
      }
    }

    .success-msg {
      background: #e8f5e9;
      color: #2e7d32;

      mat-icon {
        color: #2e7d32;
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;
      margin: 0;
    }
  `]
})
export class UploadInvoicesDialogComponent implements OnDestroy {
  private dialogRef = inject(MatDialogRef<UploadInvoicesDialogComponent>);
  private invoicesService = inject(InvoicesService);
  private pollSub?: Subscription;

  selectedFiles = signal<File[]>([]);
  uploading = signal(false);
  processing = signal(false);
  completed = signal(false);
  failed = signal(false);
  uploadStatus = signal('Procesando archivos...');
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);
  dragOver = signal(false);

  progress = signal(0);
  processedFiles = signal(0);
  totalFiles = signal(0);
  currentFile = signal<string | null>(null);
  statusText = signal('Subiendo');
  jobId = signal<number | null>(null);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.validateAndSetFiles(Array.from(input.files));
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length) {
      this.validateAndSetFiles(Array.from(event.dataTransfer.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  onDragLeave(): void {
    this.dragOver.set(false);
  }

  validateAndSetFiles(files: File[]): void {
    this.errorMsg.set(null);

    const invalidType = files.find(file => file.type !== 'application/pdf');
    if (invalidType) {
      this.errorMsg.set('Solo se permiten archivos PDF');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    const invalidSize = files.find(file => file.size > maxSize);
    if (invalidSize) {
      this.errorMsg.set(`El archivo ${invalidSize.name} excede 10 MB`);
      return;
    }

    this.selectedFiles.set(files);
  }

  upload(): void {
    const files = this.selectedFiles();
    if (!files.length) {
      return;
    }

    this.uploading.set(true);
    this.processing.set(false);
    this.completed.set(false);
    this.failed.set(false);
    this.statusText.set('Subiendo');
    this.errorMsg.set(null);
    this.successMsg.set(null);

    this.invoicesService.uploadInvoices(files).subscribe({
      next: (response: InvoiceUploadResponse) => {
        const canProcess = response.success || response.uploaded > 0;

        if (!canProcess) {
          this.uploading.set(false);
          const errors = response.errors?.length ? ` (${response.errors.join(', ')})` : '';
          this.errorMsg.set(`${response.message}${errors}`);
          return;
        }

        this.uploadStatus.set('Procesando facturas...');
        this.statusText.set('Procesando');
        this.processing.set(true);

        this.invoicesService.processInvoices(false).subscribe({
          next: (processResponse: InvoiceProcessResponse) => {
            this.uploading.set(false);
            if (processResponse.success) {
              this.jobId.set(processResponse.job_id);
              this.startPolling(processResponse.job_id, response.pendingCount || null);
            } else {
              this.processing.set(false);
              this.failed.set(true);
              this.errorMsg.set(processResponse.message || 'No se pudo iniciar el procesamiento');
            }
          },
          error: (err) => {
            this.uploading.set(false);
            this.processing.set(false);
            this.failed.set(true);
            this.errorMsg.set(err?.error?.message || 'Error al iniciar el procesamiento');
          }
        });
      },
      error: (err) => {
        this.uploading.set(false);
        this.processing.set(false);
        this.failed.set(true);
        this.errorMsg.set(err?.error?.message || 'Error de conexion al subir archivos');
      }
    });
  }

  cancel(): void {
    this.pollSub?.unsubscribe();
    this.dialogRef.close(false);
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  private startPolling(jobId: number, pendingCount: number | null): void {
    this.pollSub?.unsubscribe();

    this.pollSub = interval(1500)
      .pipe(switchMap(() => this.invoicesService.getProcessingStatus(jobId)))
      .subscribe({
        next: (status: InvoiceProcessingStatus) => {
          this.applyStatus(status);

          if (status.status === 'completed') {
            this.processing.set(false);
            this.completed.set(true);
            const pending = pendingCount ? ` · Pendientes: ${pendingCount}` : '';
            this.successMsg.set(`Proceso completado (Job #${jobId})${pending}`);
            this.pollSub?.unsubscribe();
            setTimeout(() => this.dialogRef.close({ uploaded: true, jobId }), 1500);
          }

          if (status.status === 'failed') {
            this.processing.set(false);
            this.failed.set(true);
            this.errorMsg.set(status.error || 'El procesamiento fallo');
            this.pollSub?.unsubscribe();
          }
        },
        error: () => {
          this.processing.set(false);
          this.failed.set(true);
          this.errorMsg.set('No se pudo consultar el estado del proceso');
          this.pollSub?.unsubscribe();
        }
      });
  }

  private applyStatus(status: InvoiceProcessingStatus): void {
    this.progress.set(status.progress || 0);
    this.processedFiles.set(status.processed_files || 0);
    this.totalFiles.set(status.total_files || 0);
    this.currentFile.set(status.current_file || null);
    this.statusText.set(this.formatStatus(status.status));
  }

  private formatStatus(status: InvoiceProcessingStatus['status']): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'processing':
        return 'Procesando';
      case 'completed':
        return 'Completado';
      case 'failed':
        return 'Fallido';
      default:
        return status;
    }
  }
}
