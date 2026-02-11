import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { DeviceService } from '../../../../../core/services/device.service';

@Component({
  selector: 'app-device-detail',
  templateUrl: './device-detail.html',
  styleUrls: ['./device-detail.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule]
})
export class DeviceDetailComponent implements OnInit {
  deviceId!: number;
  device: any;
  sections: Array<{ title: string; icon: string; rows: Array<{ label: string; value: string }> }> = [];

  private deviceService = inject(DeviceService);
  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.deviceId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.deviceService) {
      this.deviceService.get(this.deviceId, 'owners,brand,typeRef').subscribe({
        next: (dev: any) => {
          const payload = dev?.data ?? dev;
          this.device = payload;
          this.sections = this.buildSections(payload);
        },
        error: (err: any) => {
          this.device = null;
          this.sections = [];
          // Puedes mostrar un mensaje de error si lo deseas
        }
      });
    }
  }

  private buildSections(dev: any) {
    const ownerName = dev?.owner?.name
      ?? dev?.currentPerson?.name
      ?? dev?.current_person?.name
      ?? dev?.owners?.[0]?.person?.name
      ?? dev?.owners?.[0]?.username
      ?? 'Sin asignar';
    const ownerEmail = dev?.owner?.email
      ?? dev?.owners?.[0]?.person?.email
      ?? dev?.owners?.[0]?.username
      ?? '-';
    const manufacturer = dev?.manufacturer ?? dev?.brand?.name ?? '-';
    const deviceType = dev?.type ?? dev?.device_type?.name ?? dev?.typeRef?.name ?? '-';
    const lastSession = dev?.last_session ?? null;
    const lastConnection = dev?.last_connection ?? null;

    return [
      {
        title: 'Informacion esencial',
        icon: 'info',
        rows: [
          { label: 'Nombre del dispositivo', value: this.value(dev.hostname) },
          { label: 'Nombre de administracion', value: this.value(dev.first_hostname ?? dev.hostname) },
          { label: 'Propiedad', value: dev.assigned ? 'Asignado' : 'Sin asignar' },
          { label: 'Numero de serie', value: this.value(dev.serial) },
          { label: 'Fabricante del dispositivo', value: this.value(manufacturer) },
          { label: 'Usuario primario', value: ownerName },
          { label: 'Email usuario', value: ownerEmail },
          { label: 'Cumplimiento', value: dev.assigned ? 'Conforme' : 'Sin asignar' },
          { label: 'Sistema operativo', value: this.value(dev.os_name) },
          { label: 'Modelo del dispositivo', value: this.value(dev.model) },
          { label: 'Hora de la ultima sincronizacion', value: this.formatDateTime(dev.last_seen_at ?? dev.updated_at) },
          { label: 'Asistencia remota', value: dev.teamviewer_id ? `TeamViewer ${dev.teamviewer_id}` : 'No disponible' }
        ]
      },
      {
        title: 'Especificaciones del dispositivo',
        icon: 'memory',
        rows: [
          { label: 'Familia', value: this.value(dev.family) },
          { label: 'Procesador', value: this.value(dev.processor) },
          { label: 'RAM instalada', value: this.value(dev.ram ? `${dev.ram} GB` : '-') },
          { label: 'Disco total', value: this.value(dev.disk_total ? `${dev.disk_total} GB` : '-') },
          { label: 'Disco libre', value: this.value(dev.disk_free ? `${dev.disk_free} GB` : '-') },
          { label: 'Direccion MAC', value: this.value(dev.mac_address) },
          { label: 'ID TeamViewer', value: this.value(dev.teamviewer_id) }
        ]
      },
      {
        title: 'Sistema',
        icon: 'settings',
        rows: [
          { label: 'SO (nombre)', value: this.value(dev.os_name) },
          { label: 'SO (version)', value: this.value(dev.os_version) },
          { label: 'Instalado el', value: this.formatDate(dev.install_date) },
          { label: 'Anio de fabricacion', value: this.value(dev.manufacture_year) },
          { label: 'Uptime', value: this.value(dev.uptime) },
          { label: 'Tipo', value: this.value(deviceType) },
          { label: 'Primer visto', value: this.formatDateTime(dev.first_seen_at) },
          { label: 'Fuente primer visto', value: this.value(dev.first_seen_source) },
          { label: 'Primer usuario SID', value: this.value(dev.first_user_sid) }
        ]
      },
      {
        title: 'Actividad reciente',
        icon: 'schedule',
        rows: [
          { label: 'Ultima sesion', value: this.formatDateTime(lastSession?.login_at) },
          { label: 'Usuario (sesion)', value: this.value(lastSession?.person?.name ?? lastSession?.account?.username) },
          { label: 'IP local (sesion)', value: this.value(lastSession?.local_ip) },
          { label: 'IP publica (sesion)', value: this.value(lastSession?.public_ip) },
          { label: 'Ultima conexion', value: this.formatDateTime(lastConnection?.seen_at) },
          { label: 'IP local (conexion)', value: this.value(lastConnection?.local_ip) },
          { label: 'IP publica (conexion)', value: this.value(lastConnection?.public_ip) },
          { label: 'Interfaz', value: this.value(lastConnection?.interface_name) },
          { label: 'Gateway', value: this.value(lastConnection?.gateway_ip) },
          { label: 'DNS', value: this.value((lastConnection?.dns_servers ?? []).join(', ')) },
          { label: 'VPN activa', value: lastConnection?.vpn_active ? 'Si' : 'No' },
          { label: 'SSID', value: this.value(lastConnection?.ssid) }
        ]
      }
    ];
  }

  private value(input: any): string {
    if (input === null || input === undefined || input === '') return '-';
    return String(input);
  }

  private formatDate(input: string | null | undefined): string {
    if (!input) return '-';
    const date = new Date(input);
    if (isNaN(date.getTime())) return this.value(input);
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }

  private formatDateTime(input: string | null | undefined): string {
    if (!input) return '-';
    const date = new Date(input);
    if (isNaN(date.getTime())) return this.value(input);
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}
