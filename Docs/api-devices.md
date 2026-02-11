# API Devices (Inventario)

Base URL: /api/v1/devices

## Endpoint: Listado
GET /api/v1/devices

### Query params
- search: texto libre en hostname, serial, model, mac_address
- device_type_id: int
- assigned: 0|1
- owner_id: filtra por current_person_id
- include: csv de relaciones
  - brand
  - currentPerson
  - typeRef
  - accounts
  - owners (alias de accounts)
- sort: csv de campos, con "-" para descendente (p.ej. hostname,-created_at)
  - permitidos: id, hostname, serial, created_at, updated_at
- per_page: 1..100 (default 20)

### Owner actual
El campo owner siempre se devuelve (si existe):
- Primero se toma currentPerson si esta cargado.
- Si no, se toma la cuenta con pivot active=1 (activeAccounts).

Nota: el owner actual se resuelve aunque no mandes include. El historial completo solo se devuelve con include=owners (o include=accounts).

### Historial de owners
Para devolver historial completo, usar include=owners (o include=accounts).

### Response (paginado)
La respuesta sigue el formato de Resource Collection de Laravel:
- data: array de dispositivos
- links: paginacion
- meta: paginacion

### Ejemplo request
GET /api/v1/devices?include=owners,brand,typeRef&per_page=20

### Ejemplo response (data[0])
{
  "id": 128,
  "hostname": "CHSEBPER",
  "serial": "PF4DJK0E",
  "mac_address": "74-5D-22-3C-F8-E3",
  "manufacturer": "Dell",
  "type": "Fisico",
  "model": "21JU000EAC",
  "family": "ThinkPad E16 Gen 1",
  "processor": "AMD Ryzen 5 7530U with Radeon Graphics",
  "ram": "6",
  "disk_total": "237.6",
  "disk_free": "127.47",
  "os_name": "Microsoft Windows 11 Enterprise",
  "os_version": "10.0.26100",
  "install_date": "2025-04-10",
  "manufacture_year": "2025",
  "uptime": "8:57:03",
  "teamviewer_id": "1091749528",
  "assigned": true,
  "first_seen_at": "2025-04-10T10:00:00.000000Z",
  "first_seen_source": "agent",
  "first_user_sid": "S-1-5-21-...",
  "first_hostname": "CHSEBPER",
  "last_seen_at": "2026-02-11T12:30:00.000000Z",
  "owner": {
    "id": 98,
    "name": "Nombre Apellido",
    "email": "usuario@chaye.com.ar"
  },
  "brand": {
    "id": 1,
    "name": "Dell"
  },
  "device_type": {
    "id": 1,
    "name": "Laptop",
    "slug": null
  },
  "owners": [
    {
      "account_id": 55,
      "username": "usuario@chaye.com.ar",
      "provider": "ad",
      "assigned_at": "2025-01-15",
      "active": true,
      "person": {
        "id": 98,
        "name": "Nombre Apellido",
        "email": "usuario@chaye.com.ar"
      }
    }
  ],
  "last_session": {
    "id": 451,
    "login_at": "2026-02-11T12:25:00.000000Z",
    "local_ip": "192.168.1.10",
    "public_ip": "181.16.0.10",
    "account": {
      "id": 55,
      "username": "usuario@chaye.com.ar",
      "provider": "ad"
    },
    "person": {
      "id": 98,
      "name": "Nombre Apellido",
      "email": "usuario@chaye.com.ar"
    }
  },
  "last_connection": {
    "id": 902,
    "seen_at": "2026-02-11T12:28:00.000000Z",
    "local_ip": "192.168.1.10",
    "public_ip": "181.16.0.10",
    "mac_address": "74-5D-22-3C-F8-E3",
    "interface_name": "Ethernet",
    "interface_type": "ethernet",
    "ssid": null,
    "bssid": null,
    "gateway_ip": "192.168.1.1",
    "dns_servers": ["8.8.8.8", "1.1.1.1"],
    "vpn_active": false,
    "vpn_name": null,
    "user_sid": "S-1-5-21-...",
    "username": "usuario",
    "hostname": "CHSEBPER",
    "os_version": "10.0.26100",
    "extra_meta": null
  },
  "created_at": "2026-01-23T20:07:18.000000Z",
  "updated_at": "2026-01-23T20:07:18.000000Z"
}

## Endpoint: Detalle
GET /api/v1/devices/{id}

### Query params
- include: igual que en listado

### Ejemplo request
GET /api/v1/devices/128?include=owners,brand,typeRef

### Campos extra en detalle
Ademas de los campos basicos, el detalle devuelve:
- manufacturer, type
- first_seen_at, first_seen_source, first_user_sid, first_hostname, last_seen_at
- last_session (ultima sesion registrada)
- last_connection (ultimo heartbeat/conexion)

## Endpoint: Stats por tipo
GET /api/v1/devices/type-stats

### Query params
- assigned: 0|1 (opcional)
- owner_id: filtra por current_person_id (opcional)
- device_type_id: filtra por un tipo puntual (opcional)

### Uso para cards
Este endpoint devuelve el conteo por device_types. Cada card puede mapearse por el name del tipo (Windows, iOS/iPadOS, macOS, Android, Linux, etc.).

Ejemplos:
- /api/v1/devices/type-stats
- /api/v1/devices/type-stats?assigned=1
- /api/v1/devices/type-stats?owner_id=98
- /api/v1/devices/type-stats?device_type_id=1

### Response
{
  "data": [
    {
      "id": 1,
      "name": "Windows",
      "count": 19
    }
  ],
  "total": 19
}

### Response ejemplo (varios tipos)
{
  "data": [
    { "id": 1, "name": "Windows", "count": 19 },
    { "id": 2, "name": "iOS/iPadOS", "count": 0 },
    { "id": 3, "name": "macOS", "count": 0 },
    { "id": 4, "name": "Android", "count": 1 },
    { "id": 5, "name": "Linux", "count": 0 }
  ],
  "total": 20
}

### Mapeo sugerido para cards
Usar el campo name del device type para mapear cada card. Sugerencia:
- Windows -> card_windows
- iOS/iPadOS -> card_ios_ipados
- macOS -> card_macos
- Android -> card_android
- Linux -> card_linux

### Fallback
Si un tipo no viene en la respuesta, asumir count=0 para esa card.
