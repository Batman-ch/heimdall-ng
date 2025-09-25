import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { DeviceService } from '../../../../../core/services/device.service';

@Component({
  selector: 'app-device-detail',
  templateUrl: './device-detail.html',
  styleUrls: ['./device-detail.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule]
})
export class DeviceDetailComponent implements OnInit {
  deviceId!: number;
  device: any;
  editingField?: string;
  deviceFields: Array<{ key: string, label: string }> = [
    { key: 'hostname', label: 'Hostname' },
    { key: 'serial', label: 'Serial' },
    { key: 'model', label: 'Modelo' },
    { key: 'os', label: 'SO' },
    { key: 'owner', label: 'Owner' },
    { key: 'brand', label: 'Marca' },
    { key: 'type', label: 'Tipo' },
    { key: 'created_at', label: 'Creado' }
  ];

  private deviceService = inject(DeviceService);
  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.deviceId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.deviceService) {
      this.deviceService.get(this.deviceId).subscribe({
        next: (dev: any) => {
          this.device = dev;
        },
        error: (err: any) => {
          this.device = null;
          // Puedes mostrar un mensaje de error si lo deseas
        }
      });
    }
  }

  enableEdit(fieldKey: string) {
    this.editingField = fieldKey;
  }

  saveField(fieldKey: string) {
    // Aquí deberías guardar el valor editado, por ejemplo:
    // this.deviceService.updateDeviceField(this.deviceId, fieldKey, this.device[fieldKey]).subscribe(...)
    this.editingField = undefined;
  }
}
