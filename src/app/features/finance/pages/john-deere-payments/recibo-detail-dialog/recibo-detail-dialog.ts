import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { JohnDeereService, ReciboDetalleResponse } from '../../../../../core/services/john-deere.service';

@Component({
  selector: 'app-recibo-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon>receipt</mat-icon>
        Detalle del Recibo
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
      } @else if (detalle()) {
        <div class="recibo-detail">
          <!-- Info del Recibo -->
          <div class="recibo-info-card">
            <div class="info-grid">
              <div class="info-item">
                <label>Recibo #</label>
                <strong>{{ detalle()!.recibo.recibo_numero }}</strong>
              </div>
              <div class="info-item">
                <label>Fecha</label>
                <span>{{ formatDate(detalle()!.recibo.fecha_recibo) }}</span>
              </div>
              <div class="info-item">
                <label>Cheque</label>
                <span>{{ detalle()!.recibo.cheque_numero }}</span>
              </div>
              <div class="info-item">
                <label>Concesionario</label>
                <span>{{ detalle()!.recibo.concesionario_numero }}</span>
              </div>
              <div class="info-item">
                <label>Tipo Cambio</label>
                <span>$ {{ detalle()!.recibo.tipo_cambio | number:'1.2-2' }}</span>
              </div>
              <div class="info-item highlight">
                <label>Total Recibo</label>
                <strong class="total">{{ formatCurrency(detalle()!.recibo.total_recibo) }}</strong>
              </div>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Resumen de Órdenes -->
          <div class="totales-card">
            <h3>
              <mat-icon>summarize</mat-icon>
              Resumen de Órdenes
            </h3>
            <div class="totales-grid">
              <div class="total-item">
                <mat-icon>list_alt</mat-icon>
                <div>
                  <div class="total-value">{{ detalle()!.totales.total_ordenes }}</div>
                  <div class="total-label">Órdenes</div>
                </div>
              </div>
              <div class="total-item">
                <mat-icon>attach_money</mat-icon>
                <div>
                  <div class="total-value">{{ formatCurrency(detalle()!.totales.total_dolares) }}</div>
                  <div class="total-label">Total USD</div>
                </div>
              </div>
              <div class="total-item">
                <mat-icon>payments</mat-icon>
                <div>
                  <div class="total-value">{{ formatCurrency(detalle()!.totales.total_pesos) }}</div>
                  <div class="total-label">Total ARS</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabla de Órdenes -->
          <div class="ordenes-section">
            <h3>
              <mat-icon>list</mat-icon>
              Órdenes ({{ detalle()!.ordenes.length }})
            </h3>
            
            <div class="table-container">
              <table mat-table [dataSource]="detalle()!.ordenes" class="ordenes-table">
                
                <ng-container matColumnDef="numero_orden">
                  <th mat-header-cell *matHeaderCellDef>Número</th>
                  <td mat-cell *matCellDef="let orden">
                    <code>{{ orden.numero_orden }}</code>
                  </td>
                </ng-container>

                <ng-container matColumnDef="fecha_orden">
                  <th mat-header-cell *matHeaderCellDef>Fecha</th>
                  <td mat-cell *matCellDef="let orden">
                    {{ formatDate(orden.fecha_orden) }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="cuenta">
                  <th mat-header-cell *matHeaderCellDef>Cuenta</th>
                  <td mat-cell *matCellDef="let orden">
                    <mat-chip [class]="'chip-' + orden.cuenta">
                      {{ orden.cuenta }}
                    </mat-chip>
                  </td>
                </ng-container>

                <ng-container matColumnDef="moneda">
                  <th mat-header-cell *matHeaderCellDef>Moneda</th>
                  <td mat-cell *matCellDef="let orden">
                    <mat-chip [class]="'chip-' + orden.moneda">
                      {{ orden.moneda }}
                    </mat-chip>
                  </td>
                </ng-container>

                <ng-container matColumnDef="dolares">
                  <th mat-header-cell *matHeaderCellDef>USD</th>
                  <td mat-cell *matCellDef="let orden">
                    <span [class.zero]="orden.dolares === 0">
                      {{ formatCurrency(orden.dolares) }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="pesos">
                  <th mat-header-cell *matHeaderCellDef>ARS</th>
                  <td mat-cell *matCellDef="let orden">
                    <span [class.zero]="orden.pesos === 0">
                      {{ formatCurrency(orden.pesos) }}
                    </span>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>
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
      max-height: 70vh;
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

    .recibo-detail {
      padding: 24px;
    }

    .recibo-info-card {
      background: var(--bg-app);
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;

        .info-item {
          label {
            display: block;
            font-size: 12px;
            color: var(--text-muted);
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          strong, span {
            display: block;
            font-size: 16px;
            color: var(--text-strong);
          }

          &.highlight {
            grid-column: 1 / -1;
            padding-top: 12px;
            border-top: 2px solid var(--border-soft);

            .total {
              font-size: 24px;
              color: var(--brand-primary);
            }
          }
        }
      }
    }

    mat-divider {
      margin: 24px 0;
    }

    .totales-card {
      margin-bottom: 24px;

      h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 16px;
        font-size: 18px;
        color: var(--text-strong);

        mat-icon {
          color: var(--brand-primary);
        }
      }

      .totales-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;

        .total-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: var(--bg-app);
          border-radius: 8px;

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
            color: var(--brand-primary);
          }

          .total-value {
            font-size: 20px;
            font-weight: 600;
            color: var(--text-strong);
            line-height: 1.2;
          }

          .total-label {
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 2px;
          }
        }
      }
    }

    .ordenes-section {
      h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 16px;
        font-size: 18px;
        color: var(--text-strong);

        mat-icon {
          color: var(--brand-primary);
        }
      }
    }

    .table-container {
      border: 1px solid var(--border-soft);
      border-radius: 8px;
      overflow: hidden;
      max-height: 400px;
      overflow-y: auto;

      .ordenes-table {
        width: 100%;

        th {
          background-color: var(--bg-app);
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        code {
          background: var(--bg-app);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 13px;
          font-family: 'Courier New', monospace;
        }

        mat-chip {
          min-height: 24px;
          font-size: 12px;

          &.chip-Maquinarias {
            background: #e3f2fd;
            color: #1565c0;
          }

          &.chip-Repuestos {
            background: #f3e5f5;
            color: #6a1b9a;
          }

          &.chip-USD {
            background: #e8f5e9;
            color: #2e7d32;
          }

          &.chip-ARS {
            background: #fff3e0;
            color: #e65100;
          }
        }

        .zero {
          color: var(--text-muted);
          font-style: italic;
        }
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid var(--border-soft);
    }

    @media (max-width: 768px) {
      .recibo-info-card .info-grid {
        grid-template-columns: 1fr;
      }

      .totales-card .totales-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ReciboDetailDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ReciboDetailDialogComponent>);
  private jdService = inject(JohnDeereService);
  private data = inject<{ reciboNumero: string }>(MAT_DIALOG_DATA);

  loading = signal(true);
  errorMsg = signal<string | null>(null);
  detalle = signal<ReciboDetalleResponse | null>(null);

  displayedColumns = ['numero_orden', 'fecha_orden', 'cuenta', 'moneda', 'dolares', 'pesos'];

  ngOnInit(): void {
    this.loadDetalle();
  }

  loadDetalle(): void {
    this.loading.set(true);
    this.jdService.getRecibo(this.data.reciboNumero).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.detalle.set(response.data);
        } else {
          this.errorMsg.set(response.error || 'Error al cargar el detalle');
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Error de conexión al cargar el detalle');
        this.loading.set(false);
      }
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

  close(): void {
    this.dialogRef.close();
  }
}
