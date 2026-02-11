// src/app/core/services/john-deere.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// ============ INTERFACES ============

export interface JohnDeereRecibo {
  id: number;
  recibo_numero: string;
  fecha_recibo: string; // Laravel devuelve timestamp ISO
  cheque_numero: string;
  tipo_cambio: number | string; // Puede venir como string
  total_recibo: number | string; // Puede venir como string
  concesionario_numero: string;
  ordenes_count?: number;
  ordenes?: JohnDeereOrden[];
  pdf_filename?: string;
  pdf_path?: string;
  created_at?: string;
  updated_at?: string;
}

export interface JohnDeereOrden {
  id: number;
  recibo_id?: number;
  numero_orden: string;
  fecha_orden: string; // Laravel devuelve timestamp ISO
  dolares: number | string; // Puede venir como string
  pesos: number | string; // Puede venir como string
  moneda: 'USD' | 'ARS';
  cuenta: 'Maquinarias' | 'Repuestos';
  recibo_numero?: string; // Solo en búsquedas
  fecha_recibo?: string; // Solo en búsquedas
  cheque_numero?: string; // Solo en búsquedas
  created_at?: string;
  updated_at?: string;
}

export interface JohnDeereStats {
  total_recibos: number;
  total_ordenes: number;
  suma_dolares: number | string; // Puede venir como string
  suma_pesos: number | string; // Puede venir como string
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: { [key: string]: string[] };
  message?: string;
}

export interface SearchResponse {
  data: JohnDeereOrden[];
  filters_applied: {
    q: string | null;
    recibo: string | null;
    cheque: string | null;
    fecha_desde: string | null;
    fecha_hasta: string | null;
  };
}

export interface ReciboDetalleResponse {
  recibo: JohnDeereRecibo;
  ordenes: JohnDeereOrden[];
  totales: {
    total_ordenes: number;
    total_dolares: number;
    total_pesos: number;
  };
}

export interface UploadResponse {
  filename: string;
  recibos_procesados: number;
  ordenes_guardadas: number;
}

// ============ SERVICIO ============

@Injectable({ providedIn: 'root' })
export class JohnDeereService {
  private http = inject(HttpClient);

  /**
   * Obtener estadísticas generales
   * @param reciboNumero - Opcional: filtrar por recibo específico
   */
  getStats(reciboNumero?: string): Observable<ApiResponse<JohnDeereStats>> {
    let params = new HttpParams();
    if (reciboNumero) {
      params = params.set('recibo_numero', reciboNumero);
    }
    return this.http.get<ApiResponse<JohnDeereStats>>('/john-deere/stats', { params });
  }

  /**
   * Subir y procesar PDF
   * @param file - Archivo PDF a subir
   */
  uploadPdf(file: File): Observable<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append('pdf', file);
    return this.http.post<ApiResponse<UploadResponse>>('/john-deere/upload', formData);
  }

  /**
   * Listar todos los recibos con sus órdenes
   */
  listRecibos(): Observable<ApiResponse<JohnDeereRecibo[]>> {
    return this.http.get<ApiResponse<JohnDeereRecibo[]>>('/john-deere/recibos');
  }

  /**
   * Obtener detalle completo de un recibo
   * @param reciboNumero - Número del recibo
   */
  getRecibo(reciboNumero: string): Observable<ApiResponse<ReciboDetalleResponse>> {
    return this.http.get<ApiResponse<ReciboDetalleResponse>>(`/john-deere/recibos/${reciboNumero}`);
  }

  /**
   * Buscar órdenes con filtros avanzados
   * @param filters - Objeto con los filtros a aplicar
   */
  searchOrdenes(filters: {
    q?: string;
    recibo?: string;
    cheque?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Observable<ApiResponse<SearchResponse>> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });

    return this.http.get<ApiResponse<SearchResponse>>('/john-deere/ordenes/search', { params });
  }

  /**
   * Eliminar un recibo y todas sus órdenes
   * @param reciboNumero - Número del recibo a eliminar
   */
  deleteRecibo(reciboNumero: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`/john-deere/recibos/${reciboNumero}`);
  }

  /**
   * Reprocesar un PDF existente en el servidor
   * @param filename - Nombre del archivo PDF existente
   */
  processExisting(filename: string): Observable<ApiResponse<UploadResponse>> {
    return this.http.post<ApiResponse<UploadResponse>>('/john-deere/process-existing', { filename });
  }
}
