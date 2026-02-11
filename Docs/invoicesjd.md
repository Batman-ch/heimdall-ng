# Modulo invoicesjd (John Deere payments)

## Objetivo

Modulo para gestionar recibos de pago John Deere. Permite:
- Cargar PDF y procesarlo para crear recibos y ordenes.
- Ver listado de recibos.
- Ver detalle de un recibo con ordenes y totales.
- Buscar ordenes con filtros.
- Eliminar un recibo (borra sus ordenes).

## Base URL

- API: `/api/v1/john-deere`
- En front se usa URL relativa con `api-prefix.interceptor`.

## Modelos (contratos)

```ts
export interface JohnDeereRecibo {
  id: number;
  recibo_numero: string;
  fecha_recibo: string; // ISO
  cheque_numero: string;
  tipo_cambio: number | string;
  total_recibo: number | string;
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
  fecha_orden: string; // ISO
  dolares: number | string;
  pesos: number | string;
  moneda: 'USD' | 'ARS';
  cuenta: 'Maquinarias' | 'Repuestos';
  recibo_numero?: string; // solo en busquedas
  fecha_recibo?: string; // solo en busquedas
  cheque_numero?: string; // solo en busquedas
  created_at?: string;
  updated_at?: string;
}

export interface JohnDeereStats {
  total_recibos: number;
  total_ordenes: number;
  suma_dolares: number | string;
  suma_pesos: number | string;
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
```

## Endpoints

### 1) GET /stats
- Query opcional: `recibo_numero`
- Response: `ApiResponse<JohnDeereStats>`

### 2) POST /upload
- Content-Type: `multipart/form-data`
- Body: `pdf` (file, max 10MB)
- Response: `ApiResponse<UploadResponse>`

### 3) GET /recibos
- Response: `ApiResponse<JohnDeereRecibo[]>`

### 4) GET /recibos/{reciboNumero}
- Response: `ApiResponse<ReciboDetalleResponse>`

### 5) GET /ordenes/search
- Query opcional: `q`, `recibo`, `cheque`, `fecha_desde`, `fecha_hasta`
- Response: `ApiResponse<SearchResponse>`

### 6) DELETE /recibos/{reciboNumero}
- Response: `ApiResponse<{ message: string }>`

### 7) POST /process-existing
- Body: `{ filename: string }`
- Response: `ApiResponse<UploadResponse>`

## Vistas y estados UI

### Vista principal (listado de recibos)
- Ruta actual: `/finance/john-deere`.
- Secciones:
  - Header con titulo y boton "Cargar PDF".
  - Cards de estadisticas (recibos, ordenes, total USD, total ARS).
  - Tabla de recibos con columnas: recibo_numero, fecha_recibo, cheque_numero, concesionario_numero, ordenes_count, total_recibo, acciones.
- Estados:
  - Loading stats: spinner en cards.
  - Loading tabla: spinner y texto "Cargando recibos".
  - Empty: icono + texto + CTA "Cargar primer PDF".
  - Error: snackbar con error generico.

### Dialogo "Subir PDF"
- Drag & drop + click para seleccionar.
- Validaciones:
  - Solo PDF.
  - Max 10 MB.
- Estados:
  - Idle: dropzone + archivo seleccionado.
  - Uploading: progress bar indeterminate + texto.
  - Success: mensaje con totales y cierre automatico.
  - Error: mensaje visible en dialogo.

### Dialogo "Detalle de recibo"
- Header con icono, boton cerrar.
- Estados:
  - Loading: spinner + texto.
  - Error: icono + texto.
  - Ready: detalle recibo, resumen de ordenes y tabla.
- Secciones:
  - Info recibo: numero, fecha, cheque, concesionario, tipo_cambio, total_recibo.
  - Resumen: total_ordenes, total_usd, total_ars.
  - Tabla ordenes: numero_orden, fecha_orden, cuenta, moneda, dolares, pesos.

## Flujos clave

1) Cargar PDF
- Usuario abre dialogo.
- Front valida archivo.
- POST /upload.
- Mostrar success y recargar list + stats.

2) Ver listado
- GET /recibos y GET /stats al cargar la vista.
- Tabla con acciones: ver detalle y eliminar.

3) Ver detalle
- Abrir dialogo detalle.
- GET /recibos/{reciboNumero}.

4) Eliminar recibo
- Confirmacion.
- DELETE /recibos/{reciboNumero}.
- Recargar list + stats.

5) Buscar ordenes (si se agrega vista de busqueda)
- Form con filtros y GET /ordenes/search.
- Mostrar resultados con datos de recibo.

## Notas para front

- El backend puede devolver numericos como string. Normalizar en UI antes de formatear.
- Fechas vienen como ISO; usar Intl.DateTimeFormat.
- Moneda: USD/ARS, cuenta: Maquinarias/Repuestos.
- Los totales de stats son globales, sin paginacion.
