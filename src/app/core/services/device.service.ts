// src/app/core/services/device.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface Device {
  id: number;
  hostname: string | null;
  serial: string | null;
  mac_address: string | null;
  model: string | null;
  family: string | null;
  processor: string | null;
  ram: number | null;
  disk_total: number | null;
  disk_free: number | null;
  os_name: string | null;
  os_version: string | null;
  install_date: string | null;
  manufacture_year: string | null;
  uptime: string | null;
  teamviewer_id: string | null;
  assigned: boolean;
  owner?: { id: number; name: string; email: string | null } | null;
  brand?: { id: number; name: string } | null;
  device_type?: { id: number; name: string; slug?: string | null } | null;
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  data: T[];
  links: any;
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private http = inject(HttpClient);
  //private base = 'http://192.168.1.116/api/v1';

  list(params?: {
    search?: string;
    device_type_id?: number;
    assigned?: boolean;
    owner_id?: number;
    include?: string;   // "brand,currentPerson,typeRef"
    sort?: string;      // "hostname,-created_at"
    per_page?: number;  // 1..100
    page?: number;
  }) {
    let p = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) p = p.set(k, String(v));
      });
    }
     // 👇 URL relativa: el interceptor agregará base + /api/v1
    return this.http.get<Paginated<Device>>('/devices', { params: p });
  }

  get(id: number, include?: string) {
    let p = new HttpParams();
    if (include) p = p.set('include', include);
    return this.http.get<Device>(`/devices/${id}`, { params: p });
  }
}
