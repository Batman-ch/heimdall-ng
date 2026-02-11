import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { JohnDeereService } from '../../../../../core/services/john-deere.service';

@Component({
  selector: 'app-upload-pdf-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>upload_file</mat-icon>
      Subir PDF de Pagos
    </h2>

    <mat-dialog-content>
      @if (!uploading()) {
        <div class="upload-area" 
             [class.drag-over]="dragOver()"
             (click)="fileInput.click()"
             (drop)="onDrop($event)"
             (dragover)="onDragOver($event)"
             (dragleave)="onDragLeave()">
          <mat-icon>cloud_upload</mat-icon>
          <p><strong>Haz clic o arrastra</strong> un archivo PDF aquí</p>
          <p class="hint">Tamaño máximo: 10 MB</p>
          
          @if (selectedFile()) {
            <div class="selected-file">
              <mat-icon>picture_as_pdf</mat-icon>
              <span>{{ selectedFile()!.name }}</span>
              <button mat-icon-button (click)="clearFile($event)">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }
        </div>

        <input #fileInput type="file" accept=".pdf" 
               (change)="onFileSelected($event)" 
               style="display: none">

        @if (errorMsg()) {
          <div class="error-msg">
            <mat-icon>error</mat-icon>
            {{ errorMsg() }}
          </div>
        }
      } @else {
        <div class="uploading-state">
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          <p>{{ uploadStatus() }}</p>
        </div>
      }

      @if (successMsg()) {
        <div class="success-msg">
          <mat-icon>check_circle</mat-icon>
          {{ successMsg() }}
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()" [disabled]="uploading()">
        Cancelar
      </button>
      <button mat-raised-button color="primary" 
              (click)="upload()" 
              [disabled]="!selectedFile() || uploading()">
        <mat-icon>upload</mat-icon>
        Subir y Procesar
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
      min-width: 400px;
      padding: 20px 24px !important;
    }

    .upload-area {
      border: 2px dashed var(--border-soft);
      border-radius: 8px;
      padding: 40px;
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

      .selected-file {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 20px;
        padding: 12px;
        background: white;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);

        mat-icon:first-child {
          font-size: 24px;
          width: 24px;
          height: 24px;
          color: #d32f2f;
          margin: 0;
        }

        span {
          flex: 1;
          font-size: 14px;
          text-align: left;
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
export class UploadPdfDialogComponent {
  private dialogRef = inject(MatDialogRef<UploadPdfDialogComponent>);
  private jdService = inject(JohnDeereService);

  selectedFile = signal<File | null>(null);
  uploading = signal(false);
  uploadStatus = signal('Procesando PDF...');
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);
  dragOver = signal(false);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.validateAndSetFile(input.files[0]);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.validateAndSetFile(event.dataTransfer.files[0]);
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

  validateAndSetFile(file: File): void {
    this.errorMsg.set(null);

    if (file.type !== 'application/pdf') {
      this.errorMsg.set('Solo se permiten archivos PDF');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      this.errorMsg.set('El archivo excede el tamaño máximo de 10 MB');
      return;
    }

    this.selectedFile.set(file);
  }

  clearFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.errorMsg.set(null);
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.uploading.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    this.jdService.uploadPdf(file).subscribe({
      next: (response) => {
        this.uploading.set(false);
        if (response.success && response.data) {
          const { recibos_procesados, ordenes_guardadas } = response.data;
          this.successMsg.set(
            `✓ ${recibos_procesados} recibo(s) procesado(s) con ${ordenes_guardadas} órdenes`
          );
          setTimeout(() => this.dialogRef.close(true), 1500);
        } else {
          this.errorMsg.set(response.error || 'Error al procesar PDF');
        }
      },
      error: (err) => {
        this.uploading.set(false);
        this.errorMsg.set(err.error?.error || 'Error de conexión al subir archivo');
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
