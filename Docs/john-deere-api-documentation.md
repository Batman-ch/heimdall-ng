# Documentación API John Deere - Gestión de Recibos de Pago

## Descripción General

Sistema para gestionar recibos de pago de John Deere mediante el procesamiento de PDFs. Permite cargar, procesar, buscar y visualizar recibos con sus órdenes de pago asociadas.

## Estructura de Base de Datos

### Tabla: `john_deere_recibos` (Padre)
```sql
- id: bigint (PK, auto_increment)
- recibo_numero: string (UNIQUE) - Número único del recibo
- concesionario_numero: string - Número del concesionario
- fecha_recibo: date - Fecha del recibo
- cheque_numero: string - Número de cheque
- tipo_cambio: decimal(15,2) - Tipo de cambio aplicado
- total_recibo: decimal(15,2) - Total del recibo
- pdf_filename: string - Nombre del archivo PDF
- pdf_path: string - Ruta del archivo PDF
- created_at: timestamp
- updated_at: timestamp
```

### Tabla: `john_deere_ordenes` (Hija)
```sql
- id: bigint (PK, auto_increment)
- recibo_id: bigint (FK -> john_deere_recibos.id, CASCADE DELETE)
- numero_orden: string - Número de orden (alfanumérico, ej: 0048A00077266)
- fecha_orden: date - Fecha de la orden
- dolares: decimal(15,2) - Monto en dólares
- pesos: decimal(15,2) - Monto en pesos
- moneda: string - Tipo de moneda (USD/ARS)
- cuenta: string - Tipo de cuenta (Maquinarias/Repuestos)
- created_at: timestamp
- updated_at: timestamp

UNIQUE KEY: (recibo_id, numero_orden)
```

### Relaciones
- Un recibo tiene muchas órdenes (1:N)
- Una orden pertenece a un recibo
- Al eliminar un recibo, se eliminan todas sus órdenes automáticamente (CASCADE)

## Base URL
```
/api/v1/john-deere
```

## Endpoints de la API

### 1. Obtener Estadísticas
**GET** `/api/v1/john-deere/stats`

Retorna estadísticas generales del sistema.

**Parámetros Query (opcionales):**
- `recibo_numero` (string): Filtrar estadísticas por número de recibo específico

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "total_recibos": 43,
    "total_ordenes": 988,
    "suma_dolares": 1250000.50,
    "suma_pesos": 850000.75
  }
}
```

**Respuesta error (500):**
```json
{
  "success": false,
  "error": "Mensaje de error"
}
```

---

### 2. Subir y Procesar PDF
**POST** `/api/v1/john-deere/upload`

Sube un PDF y lo procesa automáticamente, extrayendo recibos y órdenes.

**Content-Type:** `multipart/form-data`

**Parámetros Body:**
- `pdf` (file, required): Archivo PDF (max 10MB)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "PDF procesado correctamente. 1 recibo(s) guardado(s) con 23 orden(es)",
  "data": {
    "filename": "1738675200_recibo_john_deere.pdf",
    "recibos_procesados": 1,
    "ordenes_guardadas": 23
  }
}
```

**Respuesta error validación (422):**
```json
{
  "success": false,
  "errors": {
    "pdf": ["El campo pdf es obligatorio."]
  }
}
```

**Respuesta error proceso (500):**
```json
{
  "success": false,
  "error": "Error al procesar el archivo: [mensaje de error]"
}
```

---

### 3. Listar Todos los Recibos
**GET** `/api/v1/john-deere/recibos`

Retorna la lista completa de recibos con sus órdenes, ordenados por fecha descendente.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "recibo_numero": "1400",
      "fecha_recibo": "2026-01-15",
      "cheque_numero": "1400",
      "total_recibo": 125000.50,
      "concesionario_numero": "001",
      "ordenes_count": 23,
      "ordenes": [
        {
          "id": 1,
          "numero_orden": "0048A00077266",
          "fecha_orden": "2026-01-10",
          "dolares": 5000.00,
          "pesos": 0.00,
          "moneda": "USD",
          "cuenta": "Maquinarias",
          "created_at": "2026-01-15T10:30:00.000000Z",
          "updated_at": "2026-01-15T10:30:00.000000Z"
        }
      ]
    }
  ]
}
```

---

### 4. Obtener Detalle de un Recibo
**GET** `/api/v1/john-deere/recibos/{reciboNumero}`

Retorna los detalles completos de un recibo específico con todas sus órdenes y totales.

**Parámetros URL:**
- `reciboNumero` (string): Número del recibo

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "recibo": {
      "id": 1,
      "recibo_numero": "1400",
      "fecha_recibo": "2026-01-15",
      "cheque_numero": "1400",
      "tipo_cambio": 1150.50,
      "total_recibo": 125000.50,
      "concesionario": "001"
    },
    "ordenes": [
      {
        "id": 1,
        "numero_orden": "0048A00077266",
        "fecha_orden": "2026-01-10",
        "dolares": 5000.00,
        "pesos": 0.00,
        "moneda": "USD",
        "cuenta": "Maquinarias"
      }
    ],
    "totales": {
      "total_ordenes": 23,
      "total_dolares": 50000.00,
      "total_pesos": 75000.50
    }
  }
}
```

**Respuesta error (404):**
```json
{
  "success": false,
  "error": "Recibo no encontrado"
}
```

---

### 5. Buscar Órdenes con Filtros Avanzados
**GET** `/api/v1/john-deere/ordenes/search`

Busca órdenes aplicando múltiples filtros combinables.

**Parámetros Query (todos opcionales):**
- `q` (string): Búsqueda por número de orden (LIKE %valor%)
- `recibo` (string): Filtro por número de recibo (LIKE %valor%)
- `cheque` (string): Filtro por número de cheque (LIKE %valor%)
- `fecha_desde` (date): Filtro por fecha desde (formato: YYYY-MM-DD)
- `fecha_hasta` (date): Filtro por fecha hasta (formato: YYYY-MM-DD)

**Ejemplo de llamada:**
```
GET /api/v1/john-deere/ordenes/search?q=0048A&recibo=1400&fecha_desde=2026-01-01&fecha_hasta=2026-01-31
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "numero_orden": "0048A00077266",
      "fecha_orden": "2026-01-10",
      "dolares": 5000.00,
      "pesos": 0.00,
      "moneda": "USD",
      "cuenta": "Maquinarias",
      "recibo_numero": "1400",
      "fecha_recibo": "2026-01-15",
      "cheque_numero": "1400"
    }
  ],
  "filters_applied": {
    "q": "0048A",
    "recibo": "1400",
    "cheque": null,
    "fecha_desde": "2026-01-01",
    "fecha_hasta": "2026-01-31"
  }
}
```

---

### 6. Eliminar un Recibo
**DELETE** `/api/v1/john-deere/recibos/{reciboNumero}`

Elimina un recibo y todas sus órdenes asociadas (cascade delete).

**Parámetros URL:**
- `reciboNumero` (string): Número del recibo a eliminar

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Se eliminó el recibo 1400 con 23 órdenes"
}
```

**Respuesta error (404):**
```json
{
  "success": false,
  "error": "Recibo no encontrado"
}
```

---

### 7. Procesar PDF Existente
**POST** `/api/v1/john-deere/process-existing`

Reprocesa un PDF que ya existe en el servidor.

**Content-Type:** `application/json`

**Parámetros Body:**
```json
{
  "filename": "1738675200_recibo_john_deere.pdf"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "PDF procesado correctamente. 1 recibo(s) guardado(s) con 23 orden(es)",
  "data": {
    "filename": "1738675200_recibo_john_deere.pdf",
    "recibos_procesados": 1,
    "ordenes_guardadas": 23
  }
}
```

**Respuesta error (404):**
```json
{
  "success": false,
  "error": "El archivo no existe"
}
```

---

## Modelos TypeScript para Angular

```typescript
// Modelo de Recibo
export interface JohnDeereRecibo {
  id: number;
  recibo_numero: string;
  fecha_recibo: string; // formato: YYYY-MM-DD
  cheque_numero: string;
  tipo_cambio: number;
  total_recibo: number;
  concesionario_numero: string;
  ordenes_count?: number;
  ordenes?: JohnDeereOrden[];
  created_at?: string;
  updated_at?: string;
}

// Modelo de Orden
export interface JohnDeereOrden {
  id: number;
  recibo_id?: number;
  numero_orden: string;
  fecha_orden: string; // formato: YYYY-MM-DD
  dolares: number;
  pesos: number;
  moneda: 'USD' | 'ARS';
  cuenta: 'Maquinarias' | 'Repuestos';
  recibo_numero?: string; // Solo presente en búsquedas
  fecha_recibo?: string; // Solo presente en búsquedas
  cheque_numero?: string; // Solo presente en búsquedas
  created_at?: string;
  updated_at?: string;
}

// Modelo de Estadísticas
export interface JohnDeereStats {
  total_recibos: number;
  total_ordenes: number;
  suma_dolares: number;
  suma_pesos: number;
}

// Respuesta genérica de la API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: { [key: string]: string[] };
  message?: string;
}

// Respuesta de búsqueda
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

// Respuesta de detalle de recibo
export interface ReciboDetalleResponse {
  recibo: JohnDeereRecibo;
  ordenes: JohnDeereOrden[];
  totales: {
    total_ordenes: number;
    total_dolares: number;
    total_pesos: number;
  };
}

// Respuesta de upload
export interface UploadResponse {
  filename: string;
  recibos_procesados: number;
  ordenes_guardadas: number;
}
```

---

## Ejemplo de Servicio Angular

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JohnDeereService {
  private apiUrl = `${environment.apiUrl}/api/v1/john-deere`;

  constructor(private http: HttpClient) {}

  // Obtener estadísticas
  getStats(reciboNumero?: string): Observable<ApiResponse<JohnDeereStats>> {
    let params = new HttpParams();
    if (reciboNumero) {
      params = params.set('recibo_numero', reciboNumero);
    }
    return this.http.get<ApiResponse<JohnDeereStats>>(`${this.apiUrl}/stats`, { params });
  }

  // Subir PDF
  uploadPdf(file: File): Observable<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append('pdf', file);
    return this.http.post<ApiResponse<UploadResponse>>(`${this.apiUrl}/upload`, formData);
  }

  // Listar recibos
  listRecibos(): Observable<ApiResponse<JohnDeereRecibo[]>> {
    return this.http.get<ApiResponse<JohnDeereRecibo[]>>(`${this.apiUrl}/recibos`);
  }

  // Obtener detalle de recibo
  getRecibo(reciboNumero: string): Observable<ApiResponse<ReciboDetalleResponse>> {
    return this.http.get<ApiResponse<ReciboDetalleResponse>>(`${this.apiUrl}/recibos/${reciboNumero}`);
  }

  // Buscar órdenes con filtros
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

    return this.http.get<ApiResponse<SearchResponse>>(`${this.apiUrl}/ordenes/search`, { params });
  }

  // Eliminar recibo
  deleteRecibo(reciboNumero: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.apiUrl}/recibos/${reciboNumero}`);
  }

  // Procesar PDF existente
  processExisting(filename: string): Observable<ApiResponse<UploadResponse>> {
    return this.http.post<ApiResponse<UploadResponse>>(`${this.apiUrl}/process-existing`, { filename });
  }
}
```

---

## Flujos de Trabajo

### Flujo 1: Cargar y Procesar PDF
1. Usuario selecciona archivo PDF
2. Frontend llama a `POST /upload` con FormData
3. Backend procesa el PDF y extrae datos
4. Backend guarda recibo y órdenes en BD
5. Backend retorna resumen (recibos procesados, órdenes guardadas)
6. Frontend muestra mensaje de éxito y actualiza estadísticas

### Flujo 2: Ver Lista de Recibos
1. Frontend llama a `GET /recibos` al cargar la página
2. Backend retorna lista completa con eager loading de órdenes
3. Frontend muestra tabla con: número, fecha, cheque, total, cantidad de órdenes
4. Usuario puede hacer clic en un recibo para ver detalles

### Flujo 3: Ver Detalle de Recibo
1. Usuario hace clic en un recibo
2. Frontend llama a `GET /recibos/{reciboNumero}`
3. Backend retorna recibo con todas sus órdenes y totales calculados
4. Frontend muestra modal/página con:
   - Datos del recibo (número, fecha, cheque, tipo cambio, total)
   - Tabla de todas las órdenes
   - Totales (cantidad órdenes, suma dólares, suma pesos)

### Flujo 4: Buscar Órdenes con Filtros
1. Usuario ingresa criterios de búsqueda (número orden, recibo, cheque, fechas)
2. Frontend llama a `GET /ordenes/search` con query params
3. Backend ejecuta JOIN entre ordenes y recibos
4. Backend aplica filtros dinámicamente
5. Backend retorna órdenes con datos del recibo asociado
6. Frontend muestra resultados agrupados por recibo

### Flujo 5: Eliminar Recibo
1. Usuario hace clic en botón eliminar
2. Frontend muestra confirmación
3. Usuario confirma
4. Frontend llama a `DELETE /recibos/{reciboNumero}`
5. Backend elimina recibo y todas sus órdenes (cascade)
6. Backend retorna mensaje de éxito con cantidad de órdenes eliminadas
7. Frontend actualiza lista y estadísticas

---

## Validaciones y Reglas de Negocio

### Upload de PDF
- Tamaño máximo: 10MB
- Tipo de archivo: solo PDF
- Si el PDF ya fue procesado (recibo_numero existe), actualiza los datos existentes
- Elimina órdenes antiguas y crea nuevas para evitar duplicados

### Prevención de Duplicados
- `recibo_numero` es UNIQUE a nivel de base de datos
- Combinación `(recibo_id, numero_orden)` es UNIQUE
- `updateOrCreate` en el servicio previene duplicados a nivel de aplicación

### Búsqueda Avanzada
- Todos los filtros son opcionales
- Los filtros se combinan con AND (intersección)
- Búsqueda de texto usa LIKE %valor% (búsqueda parcial)
- Fechas usan >= y <= para rangos inclusivos

### Eliminación
- Al eliminar un recibo, se eliminan TODAS sus órdenes automáticamente (ON DELETE CASCADE)
- No se puede eliminar solo una orden (integridad referencial)

---

## Notas para Implementación Frontend

### Consideraciones de UX
1. **Estadísticas**: Mostrar en cards en el header (Total Recibos, Total Órdenes, Total Pesos)
2. **Upload**: Implementar drag & drop y barra de progreso
3. **Lista**: Tabla responsive con paginación si hay muchos registros
4. **Detalle**: Modal o página separada con tabs (Info Recibo / Órdenes)
5. **Búsqueda**: Panel colapsable con formulario de filtros
6. **Eliminación**: Confirmación con modal (sweet alert)

### Formateo de Datos
- **Fechas**: Usar DatePipe de Angular con formato 'dd/MM/yyyy'
- **Montos**: Usar DecimalPipe con formato '1.2-2' (2 decimales)
- **Moneda**: Badge con color diferente (USD=verde, ARS=azul)
- **Cuenta**: Badge con color (Maquinarias=naranja, Repuestos=azul)

### Manejo de Errores
- Error 422: Mostrar mensajes de validación junto a los campos
- Error 404: Mostrar mensaje "No encontrado"
- Error 500: Mostrar mensaje genérico "Error del servidor"
- Errores de red: Mostrar mensaje "Verificar conexión"

### Performance
- Implementar debounce en búsqueda (300ms)
- Cachear estadísticas por 30 segundos
- Lazy loading de tablas grandes
- Virtual scrolling si hay más de 100 registros

---

## Variables de Entorno

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost' // o la URL de tu servidor
};

// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://192.168.1.116' // URL de producción
};
```

---

## Códigos de Estado HTTP

| Código | Significado | Cuándo ocurre |
|--------|-------------|---------------|
| 200 | OK | Operación exitosa |
| 404 | Not Found | Recibo o archivo no encontrado |
| 422 | Unprocessable Entity | Error de validación (PDF requerido, formato incorrecto) |
| 500 | Internal Server Error | Error del servidor (parsing, base de datos, etc.) |

---

## Ejemplo Completo de Componente Angular

```typescript
import { Component, OnInit } from '@angular/core';
import { JohnDeereService } from './services/john-deere.service';

@Component({
  selector: 'app-john-deere',
  templateUrl: './john-deere.component.html'
})
export class JohnDeereComponent implements OnInit {
  stats: JohnDeereStats;
  recibos: JohnDeereRecibo[] = [];
  loading = false;
  selectedFile: File | null = null;

  constructor(private johnDeereService: JohnDeereService) {}

  ngOnInit() {
    this.loadStats();
    this.loadRecibos();
  }

  loadStats() {
    this.johnDeereService.getStats().subscribe(
      response => {
        if (response.success) {
          this.stats = response.data;
        }
      },
      error => console.error('Error loading stats:', error)
    );
  }

  loadRecibos() {
    this.loading = true;
    this.johnDeereService.listRecibos().subscribe(
      response => {
        if (response.success) {
          this.recibos = response.data;
        }
        this.loading = false;
      },
      error => {
        console.error('Error loading recibos:', error);
        this.loading = false;
      }
    );
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  uploadPdf() {
    if (!this.selectedFile) return;

    this.loading = true;
    this.johnDeereService.uploadPdf(this.selectedFile).subscribe(
      response => {
        if (response.success) {
          alert(`PDF procesado: ${response.data.recibos_procesados} recibo(s), ${response.data.ordenes_guardadas} orden(es)`);
          this.loadStats();
          this.loadRecibos();
        }
        this.loading = false;
      },
      error => {
        console.error('Error uploading PDF:', error);
        alert('Error al procesar el PDF');
        this.loading = false;
      }
    );
  }

  deleteRecibo(reciboNumero: string) {
    if (!confirm('¿Estás seguro de eliminar este recibo y todas sus órdenes?')) return;

    this.johnDeereService.deleteRecibo(reciboNumero).subscribe(
      response => {
        if (response.success) {
          alert(response.data.message);
          this.loadStats();
          this.loadRecibos();
        }
      },
      error => console.error('Error deleting recibo:', error)
    );
  }
}
```

---

## Contacto y Soporte

Para cualquier duda o modificación en la API, contactar al equipo de backend.

**Versión de la API:** 1.0  
**Última actualización:** 5 de Febrero de 2026
