// src/app/features/devices/devices-page.component.ts
import { Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';



import { DeviceService, DeviceTypeStat, Paginated } from '../../../../core/services/device.service';

const ALL_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'hostname', label: 'Hostname' },
  { key: 'serial', label: 'Serial' },
  { key: 'os', label: 'SO' },
  { key: 'owner', label: 'Owner' },
  { key: 'assigned', label: 'Asignado' },
  { key: 'model', label: 'Modelo' },
  { key: 'brand', label: 'Marca' },
  { key: 'type', label: 'Tipo' },
  { key: 'created_at', label: 'Creado' },
  { key: 'actions', label: 'Acciones' }
];


type DeviceVM = {
  id: number;
  hostname: string | null;
  serial: string | null;
  assigned: boolean;
  ownerName?: string | null;
  ownerEmail?: string | null;
  brandName?: string | null;
  deviceTypeName?: string | null;
  os: string | null;
  os_name?: string | null;
  owner: string | null;
  model?: string | null;
  brand?: string | null;
  type?: string | null;
  created_at?: string; // Keeping only one definition with the correct type
};

@Component({
  selector: 'app-devices-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // material
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  MatProgressSpinnerModule,
  MatCheckboxModule,
  ],
  templateUrl: './devices.html',
  styleUrls: ['./devices.scss']
})

export class devices implements OnInit, OnDestroy {
  showColumnConfig = signal(false);
  private router = inject(Router);

  onRowClick(device: DeviceVM) {
    this.router.navigate([`/it/devices/${device.id}`]);
  }
  private deviceSvc = inject(DeviceService);

  // estado UI
  loading = signal(false);
  errorMsg = signal<string | null>(null);

  // columnas principales y todas
  displayedColumnsBasic = ['hostname', 'serial', 'os', 'owner', 'assigned'];
  displayedColumnsAll = ALL_COLUMNS.map(c => c.key);
  displayedColumns = signal<string[]>(this.displayedColumnsBasic);

  allColumns = ALL_COLUMNS;

  showAll = signal(false);

  toggleShowAll() {
    this.showAll.update(v => !v);
    this.displayedColumns.set(this.showAll() ? this.displayedColumnsAll : this.displayedColumnsBasic);
  }

  toggleColumn(col: string) {
    const cols = this.displayedColumns();
    if (cols.includes(col)) {
      this.displayedColumns.set(cols.filter(c => c !== col));
    } else {
      this.displayedColumns.set([...cols, col]);
    }
  }

  // datos
  devices = signal<DeviceVM[]>([]);
  meta = signal<Paginated<any>['meta'] | null>(null);
  typeStats = signal<DeviceTypeStat[]>([]);

  // filtros/orden/paginación
  searchCtrl = new FormControl<string>('', { nonNullable: true });
  typeCtrl = new FormControl<number | null>(null);
  assignedCtrl = new FormControl<'all' | '1' | '0'>('all');

  // paginación servidor
  pageSize = signal(20);
  pageIndex = signal(0);
  sort = signal('-created_at'); // mismo formato backend

  private subs: Subscription[] = [];

  total = computed(() => this.meta()?.total ?? 0);

  platformCards = computed(() => {
    const stats = this.typeStats();
    const normalize = (value: string) => value.toLowerCase().replace(/[\s/_-]+/g, '');
    const iconMap: Record<string, string> = {
      desktop: 'desktop_windows',
      laptop: 'laptop',
      smartphone: 'smartphone',
      tablet: 'tablet_mac',
      printer: 'print',
      router: 'router',
      switch: 'swap_horiz'
    };

    const preferredOrder = ['Desktop', 'Laptop', 'Smartphone', 'Tablet', 'Printer', 'Router', 'Switch'];
    const byName = new Map(stats.map(s => [normalize(s.name), s]));
    const ordered: DeviceTypeStat[] = [];

    preferredOrder.forEach(name => {
      const key = normalize(name);
      const stat = byName.get(key);
      if (stat) {
        ordered.push(stat);
        byName.delete(key);
      }
    });

    ordered.push(...Array.from(byName.values()));

    return ordered.map(stat => {
      const key = normalize(stat.name);
      return {
        key,
        label: stat.name,
        count: stat.count ?? 0,
        icon: iconMap[key] ?? 'devices'
      };
    });
  });

  ngOnInit(): void {
    // disparar búsqueda al tipear
    this.subs.push(
      this.searchCtrl.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(() => this.reloadFirstPage())
    );
    this.subs.push(
      this.typeCtrl.valueChanges.subscribe(() => this.reloadFirstPage())
    );
    this.subs.push(
      this.assignedCtrl.valueChanges.subscribe(() => this.reloadFirstPage())
    );

    // primera carga
    this.fetch();
    this.loadTypeStats();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  // llamado principal a la API
  fetch(): void {
    this.loading.set(true);
    this.errorMsg.set(null);

    const params: any = {
      include: 'owners,brand,typeRef',
      sort: this.sort(),
      per_page: this.pageSize(),
      page: this.pageIndex() + 1, // backend empieza en 1
    };

    const s = this.searchCtrl.value?.trim();
    if (s) params.search = s;

    const typeId = this.typeCtrl.value;
    if (typeId !== null) params.device_type_id = typeId;

    if (this.assignedCtrl.value === '1') params.assigned = 1;
    if (this.assignedCtrl.value === '0') params.assigned = 0;

    this.deviceSvc.list(params).subscribe({
      next: (res) => {
        console.log('Respuesta API dispositivos:', res);
        console.log('res.data:', res.data);
        console.log('Es res.data un array?', Array.isArray(res.data));
        if (!res || !res.data || !Array.isArray(res.data)) {
          console.error('Validación falló:', {
            existeRes: !!res,
            existeData: !!(res && res.data),
            esArray: res && res.data && Array.isArray(res.data)
          });
          this.errorMsg.set('Respuesta inesperada de la API: se esperaba un objeto paginado con array de dispositivos');
          this.devices.set([]);
          this.meta.set(null);
          this.loading.set(false);
          return;
        }
        const mapped: DeviceVM[] = res.data.map(d => ({
          id: d.id,
          hostname: d.hostname,
          serial: d.serial,
          // SO abreviado solo nombre, sin versión
          os: abbreviateOSName(d.os_name),
          os_name: d.os_name,
          os_version: d.os_version || '',
          // Owner: usar owner.name; fallback al primer owners[].person.name/username
          owner: d.owner?.name
            ?? (Array.isArray((d as any).owners) && (d as any).owners.length > 0
              ? ((d as any).owners[0].person?.name || (d as any).owners[0].username)
              : 'Sin asignar'),
          ownerEmail: d.owner?.email
            ?? (Array.isArray((d as any).owners) && (d as any).owners.length > 0
              ? ((d as any).owners[0].person?.email || (d as any).owners[0].username)
              : null),
          assigned: d.assigned,
          // campos extra para mostrar todo
          model: d.model,
          brand: d.brand?.name ?? null,
          type: d.type?.name ?? d.device_type?.name ?? null,
          created_at: d.created_at,
        }));
        console.log('Dispositivos mapeados:', mapped);
        this.devices.set(mapped);
        this.meta.set(res.meta ?? null);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMsg.set(err.message || 'Error consultando dispositivos');
        console.error('Error consultando dispositivos:', err);
      }
    });

    // Función para abreviar SO
    function abbreviateOSName(osName: string | null): string {
      if (!osName) return 'Desconocido';
      const parts = osName.split(' ');
      let abbr = '';
      if (parts[0] === 'Microsoft') abbr += 'M';
      if (parts[1] === 'Windows') abbr += 'W';
      if (parts[2]) abbr += parts[2].replace(/[^0-9A-Za-z]/g, '');
      if (parts.length > 3) abbr += ' ' + parts.slice(3).join(' ');
      // No agregar versión aquí
      return abbr.trim() || osName;
    }
  }

  loadTypeStats(): void {
    this.deviceSvc.typeStats().subscribe({
      next: (res) => this.typeStats.set(res.data ?? []),
      error: () => this.typeStats.set([])
    });
  }

  // eventos UI
  onPaginate(e: PageEvent) {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.fetch();
  }

  onClearSearch() {
    this.searchCtrl.setValue('');
  }

  onSort(column: 'hostname' | 'created_at' | 'serial') {
    const current = this.sort();
    const asc = column;
    const desc = `-${column}`;
    const next =
      current === asc ? desc :
      current === desc ? asc :
      desc; // default: desc
    this.sort.set(next);
    this.reloadFirstPage();
  }

  reloadFirstPage() {
    this.pageIndex.set(0);
    this.fetch();
    this.loadTypeStats();
  }

  // acciones
  viewDevice(row: DeviceVM) {
    // TODO: navegar a detalle si lo implementás
    console.log('ver dispositivo', row.id);
  }
}
