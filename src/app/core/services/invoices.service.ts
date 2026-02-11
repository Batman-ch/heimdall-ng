import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InvoiceFile {
  id: number;
  file_name: string;
  original_path: string;
  destination_path: string;
  category: string;
  code: string | null;
  status: 'pending' | 'moved' | 'exists' | 'error';
  size: number;
  excerpt: string | null;
  text?: string | null;
  processed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface InvoiceMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface InvoiceSearchResponse {
  data: InvoiceFile[];
  meta: InvoiceMeta;
}

export interface InvoiceSummary {
  total: number;
  by_category: Record<string, number>;
  by_status: Record<string, number>;
}

export interface InvoiceProcessingStatus {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_files: number;
  processed_files: number;
  current_file: string | null;
  progress: number;
  error: string | null;
  summary: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface InvoiceUploadResponse {
  success: boolean;
  message: string;
  uploaded: number;
  pendingCount?: number;
  errors?: string[];
}

export interface InvoiceProcessResponse {
  success: boolean;
  job_id: number;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private http = inject(HttpClient);

  searchInvoices(filters: {
    q?: string;
    file_name?: string;
    code?: string;
    category?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
  }): Observable<InvoiceSearchResponse> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<InvoiceSearchResponse>('/invoices', { params });
  }

  getInvoice(id: number, includeText = false): Observable<InvoiceFile> {
    let params = new HttpParams();
    if (includeText) {
      params = params.set('include_text', 'true');
    }
    return this.http.get<InvoiceFile>(`/invoices/${id}`, { params });
  }

  getSummary(): Observable<InvoiceSummary> {
    return this.http.get<InvoiceSummary>('/invoices/summary');
  }

  getProcessingStatus(id: number): Observable<InvoiceProcessingStatus> {
    return this.http.get<InvoiceProcessingStatus>(`/invoices/process-status/${id}`);
  }

  uploadInvoices(files: File[]): Observable<InvoiceUploadResponse> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files[]', file, file.name);
    });

    return this.http.post<InvoiceUploadResponse>('/invoices/upload', formData);
  }

  processInvoices(sendMail = false): Observable<InvoiceProcessResponse> {
    return this.http.post<InvoiceProcessResponse>('/invoices/process', { send_mail: sendMail });
  }
}
