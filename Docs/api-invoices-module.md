# API Documentation - Invoices Module

## Table of Contents
- [Introduction](#introduction)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Endpoints](#endpoints)
  - [Authentication](#1-authentication)
  - [Search Invoices](#2-search-invoices)
  - [Get Invoice Details](#3-get-invoice-details)
  - [View/Download PDF](#4-viewdownload-invoice-pdf)
  - [Get Summary Statistics](#5-get-summary-statistics)
  - [Get Processing Status](#6-get-processing-status)
- [Data Models](#data-models)
- [Error Handling](#error-handling)

---

## Introduction

The **Invoices Module** provides a REST API for managing and searching invoice PDF files. This module handles invoice file storage, processing, categorization, and retrieval.

**Key Features:**
- Invoice file search with multiple filters
- PDF viewing and downloading
- Processing status tracking
- Summary statistics
- Token-based authentication for protected endpoints

---

## Authentication

Most endpoints are **public** except for the detailed invoice endpoint which requires **Bearer Token** authentication using Laravel Sanctum.

### How to Authenticate

1. Obtain a token using the `/api/v1/token` endpoint (see below)
2. Include the token in the `Authorization` header:
   ```
   Authorization: Bearer YOUR_TOKEN_HERE
   ```

---

## Base URL

```
/api/v1
```

All endpoints are prefixed with `/api/v1/` and include rate limiting (60 requests per minute).

---

## Endpoints

### 1. Authentication

#### POST /api/v1/token

Obtain an access token for authenticated endpoints.

**Authentication:** None (public)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User email address |
| password | string | Yes | User password |

**Response (200 OK):**
```json
{
  "token": "1|abc123xyz...",
  "token_type": "bearer"
}
```

**Response (401 Unauthorized):**
```json
{
  "message": "Invalid credentials"
}
```

**Example:**
```bash
curl -X POST http://localhost/api/v1/token \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret"}'
```

---

### 2. Search Invoices

#### GET /api/v1/invoices

Search and paginate invoice files with multiple filter options.

**Authentication:** None (public)

**Query Parameters:**
| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| q | string | No | General search across file_name, code, category, status, text | - |
| file_name | string | No | Filter by file name (partial match) | - |
| code | string | No | Filter by invoice code | - |
| category | string | No | Filter by category | - |
| status | string | No | Filter by status (`pending`, `moved`, `exists`, `error`) | - |
| date_from | date | No | Filter by processed date (from) | - |
| date_to | date | No | Filter by processed date (to) | - |
| page | integer | No | Page number | 1 |
| per_page | integer | No | Results per page (max: 200) | 25 |
| sort_by | string | No | Sort field | `processed_at` |
| sort_dir | string | No | Sort direction (`asc`, `desc`) | `desc` |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "file_name": "invoice_001.pdf",
      "original_path": "public/invoicejd/invoice_001.pdf",
      "destination_path": "invoices/2026/02/",
      "category": "facturas",
      "code": "INV-2026-001",
      "status": "moved",
      "size": 245632,
      "excerpt": "Invoice excerpt text...",
      "processed_at": "2026-02-09T10:30:00.000000Z",
      "created_at": "2026-02-09T10:30:00.000000Z",
      "updated_at": "2026-02-09T10:30:00.000000Z"
    }
  ],
  "meta": {
    "total": 150,
    "per_page": 25,
    "current_page": 1,
    "last_page": 6
  }
}
```

**Example:**
```bash
# Search by file name
curl "http://localhost/api/v1/invoices?file_name=invoice_001"

# Search with multiple filters
curl "http://localhost/api/v1/invoices?status=moved&category=facturas&per_page=50"

# General text search
curl "http://localhost/api/v1/invoices?q=invoice"
```

---

### 3. Get Invoice Details

#### GET /api/v1/invoices/{id}

Get detailed information about a specific invoice.

**Authentication:** Required (Bearer Token)

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Invoice ID |

**Query Parameters:**
| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| include_text | boolean | No | Include full extracted text content | false |

**Response (200 OK):**
```json
{
  "id": 1,
  "file_name": "invoice_001.pdf",
  "original_path": "public/invoicejd/invoice_001.pdf",
  "destination_path": "invoices/2026/02/",
  "category": "facturas",
  "code": "INV-2026-001",
  "status": "moved",
  "size": 245632,
  "excerpt": "Invoice excerpt text...",
  "processed_at": "2026-02-09T10:30:00.000000Z",
  "created_at": "2026-02-09T10:30:00.000000Z",
  "updated_at": "2026-02-09T10:30:00.000000Z",
  "text": "Full extracted text content..." 
}
```

**Note:** The `text` field is only included when `include_text=true`.

**Response (401 Unauthorized):**
```json
{
  "message": "Unauthenticated."
}
```

**Response (404 Not Found):**
```json
{
  "message": "No query results for model [App\\Models\\InvoiceFile] {id}"
}
```

**Example:**
```bash
# Basic request
curl -X GET http://localhost/api/v1/invoices/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Include full text
curl -X GET "http://localhost/api/v1/invoices/1?include_text=true" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 4. View/Download Invoice PDF

#### GET /api/v1/invoices/{invoice}/view

View or download the invoice PDF file.

**Authentication:** None (public)

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| invoice | integer | Yes | Invoice ID |

**Response (200 OK):**
- Returns the PDF file with appropriate headers
- Content-Type: `application/pdf`
- Content-Disposition: `inline; filename="invoice_001.pdf"`

**Response (404 Not Found):**
```
Archivo no encontrado
```

**Example:**
```bash
# View in browser
curl -X GET http://localhost/api/v1/invoices/1/view

# Download to file
curl -X GET http://localhost/api/v1/invoices/1/view -o invoice.pdf
```

**Browser Access:**
```
http://localhost/api/v1/invoices/1/view
```

---

### 5. Get Summary Statistics

#### GET /api/v1/invoices/summary

Get aggregated statistics for all invoices.

**Authentication:** None (public)

**Response (200 OK):**
```json
{
  "total": 150,
  "by_category": {
    "facturas": 80,
    "remisiones": 40,
    "otros": 30
  },
  "by_status": {
    "moved": 120,
    "pending": 20,
    "exists": 5,
    "error": 5
  }
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| total | integer | Total number of invoices |
| by_category | object | Count of invoices grouped by category |
| by_status | object | Count of invoices grouped by status |

**Example:**
```bash
curl -X GET http://localhost/api/v1/invoices/summary
```

---

### 6. Get Processing Status

#### GET /api/v1/invoices/process-status/{id}

Get the current status of an invoice processing job.

**Authentication:** None (public)

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Processing job ID |

**Response (200 OK):**
```json
{
  "id": 1,
  "status": "processing",
  "total_files": 100,
  "processed_files": 45,
  "current_file": "invoice_045.pdf",
  "progress": 45.00,
  "error": null,
  "summary": null,
  "started_at": "2026-02-09T10:00:00.000000Z",
  "completed_at": null
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| id | integer | Job ID |
| status | string | Job status (`pending`, `processing`, `completed`, `failed`) |
| total_files | integer | Total number of files to process |
| processed_files | integer | Number of files processed so far |
| current_file | string\|null | Current file being processed |
| progress | float | Processing progress percentage (0-100) |
| error | string\|null | Error message if job failed |
| summary | object\|null | Summary data when job completes |
| started_at | string\|null | ISO 8601 timestamp when job started |
| completed_at | string\|null | ISO 8601 timestamp when job completed |

**Response (404 Not Found):**
```json
{
  "message": "No query results for model [App\\Models\\InvoiceProcessingJob] {id}"
}
```

**Example:**
```bash
curl -X GET http://localhost/api/v1/invoices/process-status/1
```

---

## Data Models

### InvoiceFile

The main invoice file model.

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| id | integer | Unique identifier |
| file_name | string | Original PDF file name |
| original_path | string | Path to original uploaded file |
| destination_path | string | Path where file was moved after processing |
| category | string | Invoice category (e.g., "facturas", "remisiones") |
| code | string | Extracted invoice code |
| status | string | Processing status: `pending`, `moved`, `exists`, `error` |
| size | integer | File size in bytes |
| excerpt | string | Short text excerpt from the invoice |
| text | string | Full extracted text content (only in detail view with `include_text=true`) |
| processed_at | timestamp | When the invoice was processed |
| created_at | timestamp | Record creation timestamp |
| updated_at | timestamp | Record last update timestamp |

**Status Values:**
- `pending`: File uploaded but not yet processed
- `moved`: File successfully processed and moved to destination
- `exists`: File already exists in destination (duplicate)
- `error`: Error occurred during processing

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 401 | Unauthorized - Invalid or missing authentication token |
| 404 | Not Found - Resource not found |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

### Error Response Format

```json
{
  "message": "Error description"
}
```

### Validation Error Format (422)

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "field_name": [
      "Error message for this field"
    ]
  }
}
```

### Rate Limiting

The API is limited to **60 requests per minute** per IP address. When exceeded, you'll receive a `429 Too Many Requests` response.

---

## Complete Usage Example

### Full Workflow Example

```bash
# 1. Get authentication token
TOKEN=$(curl -s -X POST http://localhost/api/v1/token \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret"}' \
  | jq -r '.token')

# 2. Get summary statistics
curl -X GET http://localhost/api/v1/invoices/summary

# 3. Search for invoices with status "moved"
curl -X GET "http://localhost/api/v1/invoices?status=moved&per_page=10"

# 4. Get detailed information for invoice ID 1
curl -X GET "http://localhost/api/v1/invoices/1?include_text=true" \
  -H "Authorization: Bearer $TOKEN"

# 5. View the PDF file
curl -X GET http://localhost/api/v1/invoices/1/view -o invoice.pdf

# 6. Check processing status for job ID 5
curl -X GET http://localhost/api/v1/invoices/process-status/5
```

---

## Notes

- All timestamps are in **ISO 8601** format with UTC timezone
- File sizes are in **bytes**
- The API uses **Laravel Sanctum** for authentication
- PDF files are served with `Content-Disposition: inline` to display in browser
- The search endpoint supports full-text search across multiple fields using the `q` parameter
- Date filters (`date_from`, `date_to`) use the `processed_at` field

---

## Support

For issues or questions, please contact the development team or refer to the application logs.
