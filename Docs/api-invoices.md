# Invoice Files API

Base URL: `http://192.168.1.116/api/v1/invoices`

---

## Endpoints

### 1) POST /api/v1/invoices/upload

Upload PDF invoice files to the server for processing.

**⚠️ IMPORTANT:** This endpoint only uploads files to disk. You must call `/api/v1/invoices/process` afterwards to process them and insert into database.

**URL:** `POST http://192.168.1.116/api/v1/invoices/upload`  
**Content-Type:** `multipart/form-data`  
**Authentication:** None (public)

**Request Body:**
- `files[]` (File[]) : Array of PDF files (required, min: 1 file)
- Each file must be:
  - PDF format (`.pdf`)
  - Maximum 10MB per file

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Se subieron 2 archivo(s) correctamente",
  "uploaded": 2,
  "pendingCount": 15
}
```

**Response (Partial Error - 422):**
```json
{
  "success": false,
  "message": "Subidos 1 archivos. Errores: Failed to upload invoice2.pdf",
  "uploaded": 1,
  "errors": ["Failed to upload invoice2.pdf"],
  "pendingCount": 16
}
```

**Response (Error - 500):**
```json
{
  "success": false,
  "message": "Error al subir archivos: ..."
}
```

**cURL Example:**
```bash
curl -X POST http://192.168.1.116/api/v1/invoices/upload \
  -F "files[]=@/path/to/invoice1.pdf" \
  -F "files[]=@/path/to/invoice2.pdf"
```

**Angular Example:**
```typescript
uploadInvoices(files: File[]): Observable<any> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files[]', file, file.name);
  });
  return this.http.post('http://192.168.1.116/api/v1/invoices/upload', formData);
}
```

---

### 2) POST /api/v1/invoices/process

Process uploaded invoice files and insert them into the database.

**⚠️ IMPORTANT:** Call this after uploading files with `/api/v1/invoices/upload`.

**URL:** `POST http://192.168.1.116/api/v1/invoices/process`  
**Content-Type:** `application/json`  
**Authentication:** None (public)

**Request Body (optional):**
```json
{
  "send_mail": false
}
```

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| send_mail | boolean | Send email notification when processing completes | false |

**Response (200):**
```json
{
  "success": true,
  "job_id": 5,
  "message": "Procesamiento iniciado"
}
```

**What it does:**
1. Creates a processing job record
2. Dispatches background job to process all files in `public/invoicejd/`
3. Extracts text, categorizes, and moves files
4. Inserts records into `invoice_files` table
5. Returns job ID for tracking progress

**cURL Example:**
```bash
# Start processing uploaded files
curl -X POST http://192.168.1.116/api/v1/invoices/process

# Check processing status
curl http://192.168.1.116/api/v1/invoices/process-status/5
```

**Angular Example:**
```typescript
processInvoices(sendMail: boolean = false): Observable<any> {
  return this.http.post(`${this.API_URL}/process`, { send_mail: sendMail });
}

// Complete upload + process workflow
uploadAndProcessInvoices(files: File[]) {
  this.uploadInvoices(files).subscribe({
    next: (uploadResponse) => {
      console.log('Uploaded:', uploadResponse.uploaded);
      
      // Now process the uploaded files
      this.processInvoices().subscribe({
        next: (processResponse) => {
    4     console.log('Processing started:', processResponse.job_id);
          // Poll for status using job_id
        }
      });
    }
  });
}
```

---

### 3) GET /api/v1/invoices

Search and paginate invoice records.

**URL:** `GET http://192.168.1.116/api/v1/invoices`  
**Authentication:** Required (Sanctum Bearer token)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Full text search across file_name, code, category, status, text |
| file_name | string | Partial match on file name |
| code | string | Filter by code extracted from filename |
| category | string | Category name (e.g., "Repuestos", "Maquinarias") |
| status | string | `pending\|moved\|exists\|error` |
| date_from | date | Lower bound for processed_at (YYYY-MM-DD) |
| date_to | date | Upper bound for processed_at (YYYY-MM-DD) |
| page | int | Page number (pagination) |
| per_page | int | Items per page (max 200, default 25) |
| sort_by | string | Column to sort (default: `processed_at`) |
| sort_dir | string | `asc` or `desc` (default: `desc`) |
| include_text | boolean | Include full extracted text in results |

**Response (200):**
```json
{
  "data": [
    {
      "id": 123,
      "file_name": "INV-ABC-0044-01.pdf",
      "original_path": "public/invoicejd/INV-ABC-0044-01.pdf",
      "destination_path": "public/Facturas/Repustos/20-01-2026/INV-ABC-0044-01.pdf",
      "category": "Repustos",
      "code": "0044",
      "status": "moved",
      "size": 12345,
      "excerpt": "Primeros 1000 caracteres del texto extraido...",
      "processed_at": "2026-01-20T12:34:56.000000Z",
      "created_at": "2026-01-20T12:34:56.000000Z",
      "updated_at": "2026-01-20T12:34:56.000000Z"
    }
  ],
  "meta": {
    "total": 42,
    "per_page": 25,
    "current_page": 1,
    "last_page": 2
  }
}
```

**Examples:**
```bash
# Search for "PC" in text, 50 per page
GET http://192.168.1.116/api/v1/invoices?q=PC&per_page=50

# Filter by status
GET http://192.168.1.116/api/v1/invoices?status=moved&category=Repuestos
```

---

### 3) GET /api/v1/invoices/{id}

Get a single invoice file record.

**URL:** `GET http://192.168.1.116/api/v1/invoices/{id}`  
**Authentication:** Required (Sanctum Bearer token)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| include_text | boolean | Include full extracted text (default: false) |

**Response (200):**
Same object as in `data` array from list endpoint, optionally with `text` field.

**Example:**
```bash
GET http://192.168.1.116/api/v1/invoices/123?include_text=1
```

---

### 5) GET /api/v1/invoices/summary

Get aggregated statistics for all invoices.

**URL:** `GET http://192.168.1.116/api/v1/invoices/summary`  
**Authentication:** Required (Sanctum Bearer token)

**Response (200):**
```json
{
  "total": 42,
  "by_category": { 
    "Repuestos": 10, 
    "Maquinarias": 5,
    "Otros": 27
  },
  "by_status": { 
    "moved": 30, 
    "pending": 10,
    "exists": 2
  }
}
```

---

### 6) GET /api/v1/invoices/process-status/{id}

---

### 8) DELETE /api/v1/invoices/clear-data

**URL:** `GET http://192.168.1.116/api/v1/invoices/data-stats`  
**Authentication:** None (public)

**Response (200):**
```json
{
  "invoice_files": {
    "total": 150,
    "by_status": {
      "moved": 120,
      "pending": 20,
      "exists": 5,
      "error": 5
    }
  },
  "processing_jobs": {
    "total": 10,
    "by_status": {
      "completed": 8,
      "failed": 2
    }
  }
}
```

Get the current status of an invoice processing job.

**URL:** `GET http://192.168.1.116/api/v1/invoices/process-status/{id}`  
**Authentication:** None (public)

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Processing job ID (from `/process` response) |

**Response (200):**
```json
{
  "id": 5,
  "status": "processing",
  "total_files": 10,
  "processed_files": 7,
  "current_file": "invoice_007.pdf",
  "progress": 70.00,
  "error": null,
  "summary": null,
  "started_at": "2026-02-10T11:47:00.000000Z",
  "completed_at": null
}
```

**Status values:**
- `pending`: Job created, not started yet
- `processing`: Currently processing files (check `progress` field for percentage)
- `completed`: All files processed successfully
- `failed`: Job failed with error

**Progress tracking:**
- `progress`: Percentage (0-100) - use this to show progress bar
- `processed_files` / `total_files`: Show "7 / 10 files"
- `current_file`: Show which file is being processed
- Poll this endpoint every 1-2 seconds until status is `completed` or `failed`

**Example:**
```bash
curl http://192.168.1.116/api/v1/invoices/process-status/5
```

**Angular Example - Real-time Progress:**
```typescript
import { Component } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-upload-progress',
  template: `
    <div class="upload-container">
      <!-- File Selection -->
      <input 
        type="file" 
        (change)="onFileSelect($event)"
        multiple
        accept=".pdf"
        [disabled]="uploading || processing"
      />
      
      <button 
        (click)="uploadAndProcess()" 
        [disabled]="!selectedFiles.length || uploading || processing"
      >
        {{ getButtonText() }}
      </button>
      
      <!-- Upload Progress -->
      <div *ngIf="uploading" class="progress-section">
        <h3>Subiendo archivos...</h3>
        <div class="spinner"></div>
      </div>
      
      <!-- Processing Progress -->
      <div *ngIf="processing" class="progress-section">
        <h3>Procesando archivos</h3>
        
        <!-- Progress Bar -->
        <div class="progress-bar-container">
          <div 
            class="progress-bar" 
            [style.width.%]="progress"
          ></div>
        </div>
        
        <!-- Progress Info -->
        <p class="progress-text">{{ progress.toFixed(1) }}%</p>
        <p class="status-text">Estado: {{ statusText }}</p>
        <p class="files-text">
          {{ processedFiles }} de {{ totalFiles }} archivos procesados
        </p>
        <p class="current-file" *ngIf="currentFile">
          Procesando: {{ currentFile }}
        </p>
      </div>
      
      <!-- Completion Message -->
      <div *ngIf="completed" class="success-message">
        <h3>✓ Proceso completado</h3>
        <p>{{ totalFiles }} archivos procesados exitosamente</p>
      </div>
      
      <!-- Error Message -->
      <div *ngIf="error" class="error-message">
        <h3>✗ Error en el proceso</h3>
        <p>{{ errorMessage }}</p>
      </div>
    </div>
  `,
  styles: [`
    .progress-bar-container {
      width: 100%;
      height: 30px;
      background: #e0e0e0;
      border-radius: 15px;
      overflow: hidden;
      margin: 20px 0;
    }
    
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #4CAF50, #8BC34A);
      transition: width 0.3s ease;
    }
    
    .progress-text {
      font-size: 24px;
      font-weight: bold;
      color: #4CAF50;
      margin: 10px 0;
    }
    
    .status-text {
      font-size: 16px;
      color: #666;
    }
    
    .current-file {
      font-size: 14px;
      color: #999;
      font-style: italic;
    }
  `]
})
export class UploadProgressComponent {
  selectedFiles: File[] = [];
  uploading = false;
  processing = false;
  completed = false;
  error = false;
  
  progress = 0;
  statusText = '';
  processedFiles = 0;
  totalFiles = 0;
  currentFile = '';
  errorMessage = '';
  
  private pollSubscription?: Subscription;

  constructor(private invoiceService: InvoiceApiService) {}

  onFileSelect(event: any) {
    this.selectedFiles = Array.from(event.target.files);
    this.resetState();
  }

  getButtonText(): string {
    if (this.uploading) return 'Subiendo...';
    if (this.processing) return 'Procesando...';
    return `Subir ${this.selectedFiles.length} archivo(s)`;
  }

  resetState() {
    this.completed = false;
    this.error = false;
    this.progress = 0;
    this.processedFiles = 0;
    this.totalFiles = 0;
    this.currentFile = '';
    this.errorMessage = '';
  }

  uploadAndProcess() {
    if (!this.selectedFiles.length) return;
    
    this.resetState();
    this.uploading = true;
    
    // Step 1: Upload files
    this.invoiceService.uploadInvoices(this.selectedFiles).subscribe({
      next: (uploadResponse) => {
        this.uploading = false;
        
        if (!uploadResponse.success) {
          this.error = true;
          this.errorMessage = uploadResponse.message;
          return;
        }
        
        console.log(`Uploaded ${uploadResponse.uploaded} files`);
        
        // Step 2: Start processing
        this.startProcessing();
      },
      error: (err) => {
        this.uploading = false;
        this.error = true;
        this.errorMessage = err.error?.message || 'Error al subir archivos';
      }
    });
  }

  startProcessing() {
    this.processing = true;
    
    this.invoiceService.processInvoices().subscribe({
      next: (response) => {
        const jobId = response.job_id;
        console.log(`Processing started with job ID: ${jobId}`);
        
        // Start polling for status every 1.5 seconds
        this.pollProcessingStatus(jobId);
      },
      error: (err) => {
        this.processing = false;
        this.error = true;
        this.errorMessage = err.error?.message || 'Error al iniciar procesamiento';
      }
    });
  }

  pollProcessingStatus(jobId: number) {
    // Poll every 1500ms (1.5 seconds)
    this.pollSubscription = interval(1500).pipe(
      switchMap(() => this.invoiceService.getProcessStatus(jobId)),
      takeWhile(
        status => status.status === 'processing' || status.status === 'pending',
        true // inclusive - get the final status too
      )
    ).subscribe({
      next: (status) => {
        // Update progress
        this.progress = status.progress || 0;
        this.processedFiles = status.processed_files || 0;
        this.totalFiles = status.total_files || 0;
        this.currentFile = status.current_file || '';
        this.statusText = this.getStatusText(status.status);
        
        console.log(`Progress: ${this.progress}% (${this.processedFiles}/${this.totalFiles})`);
        
        // Check if completed
        if (status.status === 'completed') {
          this.processing = false;
          this.completed = true;
          this.cleanupPolling();
          console.log('Processing completed successfully!');
        } else if (status.status === 'failed') {
          this.processing = false;
          this.error = true;
          this.errorMessage = status.error || 'Error en el procesamiento';
          this.cleanupPolling();
          console.error('Processing failed:', status.error);
        }
      },
      error: (err) => {
        this.processing = false;
        this.error = true;
        this.errorMessage = 'Error al verificar el estado del procesamiento';
        this.cleanupPolling();
        console.error('Status polling error:', err);
      }
    });
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Iniciando...';
      case 'processing': return 'Procesando archivos...';
      case 'completed': return 'Completado';
      case 'failed': return 'Error';
      default: return status;
    }
  }

  cleanupPolling() {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
      this.pollSubscription = undefined;
    }
  }

  ngOnDestroy() {
    this.cleanupPolling();
  }
}
```

**Simple polling example:**
```typescript
// Simpler version
pollStatus(jobId: number) {
  const interval = setInterval(() => {
    this.invoiceService.getProcessStatus(jobId).subscribe(status => {
      this.progress = status.progress;
      this.processedFiles = status.processed_files;
      this.totalFiles = status.total_files;
      
      if (status.status === 'completed' || status.status === 'failed') {
        clearInterval(interval);
        console.log('Done!', status.status);
      }
    });
  }, 1500); // Poll every 1.5 seconds
}
```

---

### 7) GET /api/v1/invoices/data-stats

**⚠️ DANGER:** Clear all invoice files and processing jobs from database.

**URL:** `DELETE http://192.168.1.116/api/v1/invoices/clear-data`  
**Authentication:** None (public, but should be protected in production)

**Response (200):**
```json
{
  "success": true,
  "message": "Todos los datos fueron eliminados correctamente",
  "deleted": {
    "invoice_files": 150,
    "processing_jobs": 10
  }
}
```

**Response (500):**
```json
{
  "success": false,
  "message": "Error al eliminar datos: ..."
}
```

**cURL Example:**
```bash
curl -X DELETE http://192.168.1.116/api/v1/invoices/clear-data
```

**Angular Example:**
```typescript
clearAllData(): Observable<any> {
  return this.http.delete(`${this.API_URL}/clear-data`);
}

// Usage with confirmation
deleteAllInvoiceData() {
  if (confirm('¿Estás seguro de eliminar TODOS los datos de invoices?')) {
    this.invoiceService.clearAllData().subscribe({
      next: (response) => {
        console.log('Deleted:', response.deleted);
      },
      error: (error) => {
        console.error('Delete failed:', error);
      }
    });
  }
}
```

---

## Authentication

The API uses **Laravel Sanctum** for authentication.

### Getting a Token

**Endpoint:** `POST /api/v1/token` (if available)  
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "token": "1|abc123xyz...",
  "token_type": "bearer"
}
```

### Using the Token

Include the token in the `Authorization` header:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## Angular Complete Service Example

```typescript
// invoice-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InvoiceSearchParams {
  q?: string;
  file_name?: string;
  code?: string;
  category?: string;
  status?: 'pending' | 'moved' | 'exists' | 'error';
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  include_text?: boolean;
}

export interface InvoiceFile {
  id: number;
  file_name: string;
  original_path: string;
  destination_path: string;
  category: string;
  code: string;
  status: string;
  size: number;
  excerpt: string;
  text?: string;
  processed_at: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceListResponse {
  data: InvoiceFile[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface InvoiceSummary {
  total: number;
  by_category: { [key: string]: number };
  by_status: { [key: string]: number };
}

export interface UploadResponse {
  success: boolean;
  message: string;
  uploaded: number;
  pendingCount: number;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceApiService {
  private readonly BASE_URL = 'http://192.168.1.116';
  private readonly API_URL = `${this.BASE_URL}/api/v1/invoices`;

  constructor(private http: HttpClient) {}

  /**
   * Upload PDF files to the server
   */
  uploadInvoices(files: File[]): Observable<UploadResponse> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files[]', file, file.name);
    });
    return this.http.post<UploadResponse>(`${this.API_URL}/upload`, formData);
  }

  /**
   * Process uploaded invoice files (inserts into database)
   */
  processInvoices(sendMail: boolean = false): Observable<any> {
    return this.http.post(`${this.API_URL}/process`, { send_mail: sendMail });
  }

  /**
   * Get processing job status
   */
  getProcessStatus(jobId: number): Observable<any> {
    return this.http.get(`${this.API_URL}/process-status/${jobId}`);
  }

  /**
   * Search and list invoices with filters
   */
  list(params?: InvoiceSearchParams): Observable<InvoiceListResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = (params as any)[key];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<InvoiceListResponse>(this.API_URL, { params: httpParams });
  }

  /**
   * Get a single invoice by ID
   */
  get(id: number, includeText: boolean = false): Observable<InvoiceFile> {
    const params = includeText ? { include_text: '1' } : {};
    return this.http.get<InvoiceFile>(`${this.API_URL}/${id}`, { params });
  }

  /**
   * Get summary statistics
   */
  summary(): Observable<InvoiceSummary> {
    return this.http.get<InvoiceSummary>(`${this.API_URL}/summary`);
  }

  /**
   * Get data statistics (before clearing)
   */
  dataStats(): Observable<any> {
    return this.http.get(`${this.API_URL}/data-stats`);
  }

  /**
   * Clear all invoice data (DANGER: deletes all records)
   */
  clearAllData(): Observable<any> {
    return this.http.delete(`${this.API_URL}/clear-data`);
  }
}
```

### Component Example - Upload

```typescript
import { Component } from '@angular/core';
import { InvoiceApiService } from './invoice-api.service';
import { interval } from 'rxjs';
import { takeWhile, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-upload-invoices',
  template: `
    <input 
      type="file" 
      (change)="onFileSelect($event)"
      multiple
      accept=".pdf"
    />
    <button 
      (click)="uploadFiles()" 
      [disabled]="!selectedFiles.length || uploading"
    >
      {{ uploading ? 'Uploading...' : 'Upload' }}
    </button>
    
    <div *ngIf="uploadResult">
      <p [class.success]="uploadResult.success">
        {{ uploadResult.message }}
      </p>
    </div>
    
    <div *ngIf="processing">
      <p>Processing files... {{ progress }}%</p>
      <p>Status: {{ processStatus }}</p>
      <p>{{ processedFiles }} / {{ totalFiles }} files</p>
    </div>
  `
})
export class UploadInvoicesComponent {
  selectedFiles: File[] = [];
  uploading = false;
  processing = false;
  uploadResult: any = null;
  progress = 0;
  processStatus = '';
  processedFiles = 0;
  totalFiles = 0;

  constructor(private invoiceService: InvoiceApiService) {}

  onFileSelect(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }

  uploadFiles() {
    if (!this.selectedFiles.length) return;
    
    this.uploading = true;
    
    // Step 1: Upload files
    this.invoiceService.uploadInvoices(this.selectedFiles).subscribe({
      next: (uploadResponse) => {
        this.uploadResult = uploadResponse;
        this.uploading = false;
        this.selectedFiles = [];
        
        if (uploadResponse.success) {
          // Step 2: Process uploaded files
          this.startProcessing();
        }
      },
      error: (error) => {
        this.uploadResult = {
          success: false,
          message: error.error?.message || 'Upload failed'
        };
        this.uploading = false;
      }
    });
  }

  startProcessing() {
    this.processing = true;
    
    this.invoiceService.processInvoices().subscribe({
      next: (processResponse) => {
        const jobId = processResponse.job_id;
        
        // Poll for status every 2 seconds
        interval(2000).pipe(
          switchMap(() => this.invoiceService.getProcessStatus(jobId)),
          takeWhile(status => status.status === 'processing' || status.status === 'pending', true)
        ).subscribe({
          next: (status) => {
            this.processStatus = status.status;
            this.processedFiles = status.processed_files;
            this.totalFiles = status.total_files;
            this.progress = status.progress;
            
            if (status.status === 'completed' || status.status === 'failed') {
              this.processing = false;
            }
          }
        });
      },
      error: (error) => {
        console.error('Processing failed:', error);
        this.processing = false;
      }
    });
  }
}
```

### Component Example - Search

```typescript
import { Component, OnInit } from '@angular/core';
import { InvoiceApiService, InvoiceFile } from './invoice-api.service';

@Component({
  selector: 'app-invoice-list',
  template: `
    <input 
      [(ngModel)]="searchText" 
      (keyup.enter)="search()"
      placeholder="Search..."
    />
    <button (click)="search()">Search</button>
    
    <table>
      <tr *ngFor="let invoice of invoices">
        <td>{{ invoice.file_name }}</td>
        <td>{{ invoice.code }}</td>
        <td>{{ invoice.category }}</td>
        <td>{{ invoice.status }}</td>
      </tr>
    </table>
    
    <div>
      <button [disabled]="currentPage === 1" (click)="previousPage()">Prev</button>
      Page {{ currentPage }} of {{ lastPage }}
      <button [disabled]="currentPage === lastPage" (click)="nextPage()">Next</button>
    </div>
  `
})
export class InvoiceListComponent implements OnInit {
  invoices: InvoiceFile[] = [];
  searchText = '';
  currentPage = 1;
  lastPage = 1;

  constructor(private invoiceService: InvoiceApiService) {}

  ngOnInit() {
    this.loadInvoices();
  }

  search() {
    this.currentPage = 1;
    this.loadInvoices();
  }

  loadInvoices() {
    this.invoiceService.list({
      q: this.searchText || undefined,
      page: this.currentPage,
      per_page: 25
    }).subscribe(response => {
      this.invoices = response.data;
      this.currentPage = response.meta.current_page;
      this.lastPage = response.meta.last_page;
    });
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadInvoices();
    }
  }

  nextPage() {
    if (this.currentPage < this.lastPage) {
      this.currentPage++;
      this.loadInvoices();
    }
  }
}
```

---

## Important Notes for Angular Developers

### Different Base URLs
- **Base URL
- **All endpoints:** `http://192.168.1.116/api/v1/invoices`
- All endpoints are under `/api/v1/` prefix

### File Upload Format
- **Field name:** `files[]` (NOT `pdf[i][file]`)
- **Usage:** `formData.append('files[]', file, file.name)`

### Authentication
- Most endpoints are public (no auth required)
- Only `/api/v1/invoices/{id}` requires Sanctum Bearer token
- Use HTTP interceptor to add `Authorization: Bearer <token>` header when needed
### File Constraints
- Only PDF files
- Max 10MB per file
- Can upload multiple files in one request

### Rate Limiting
- 60 requests per minute per IP
- Handle 429 responses appropriately

### CORS
- Ensure Angular app origin is allowed in Laravel CORS config
- Set `withCredentials: true` in HttpClient if using cookies

---

## Complete Upload & Process Workflow

**⚠️ CRITICAL:** Uploading files does NOT insert them into the database. You must follow this 2-step process:

### Step 1: Upload Files
```bash
POST http://192.168.1.116/api/v1/invoices/upload
```
This saves PDF files to disk at `storage/app/public/invoicejd/`

### Step 2: Process Files
```bash
POST http://192.168.1.116/api/v1/invoices/process
```
This:
- Reads files from `public/invoicejd/`
- Extracts text using PDF parser
- Categorizes based on filename/content
- Moves files to organized folders
- **Inserts records into `invoice_files` table**

### Step 3: Track Progress (optional)
```bash
GET http://192.168.1.116/api/v1/invoices/process-status/{job_id}
```

### Complete Example:
```typescript
// 1. Upload files
this.invoiceService.uploadInvoices(files).subscribe(uploadRes => {
  console.log(`Uploaded ${uploadRes.uploaded} files`);
  
  // 2. Process uploaded files
  this.invoiceService.processInvoices().subscribe(processRes => {
    const jobId = processRes.job_id;
    
    // 3. Poll for completion
    const poll = setInterval(() => {
      this.invoiceService.getProcessStatus(jobId).subscribe(status => {
        console.log(`Progress: ${status.progress}%`);
        
        if (status.status === 'completed') {
          console.log('Processing complete!');
          clearInterval(poll);
          
          // 4. Now you can query the database
          this.invoiceService.list().subscribe(invoices => {
            console.log('Invoices in DB:', invoices);
          });
        }
      });
    }, 2000);
  });
});
```
