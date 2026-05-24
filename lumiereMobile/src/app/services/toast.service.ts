import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  checkmarkCircleOutline,
  closeOutline,
  informationCircleOutline,
  warningOutline,
} from 'ionicons/icons';

export type OtflowToastType = 'success' | 'error' | 'warning' | 'info' | 'danger';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(private toastController: ToastController) {
    addIcons({
      checkmarkCircleOutline,
      alertCircleOutline,
      informationCircleOutline,
      warningOutline,
      closeOutline,
    });
  }

  async show(
    message: string,
    type: OtflowToastType = 'info',
    duration = 3200
  ): Promise<void> {
    const normalized = this.normalizeType(type);
    const icon = this.iconForType(normalized);

    const toast = await this.toastController.create({
      message,
      duration,
      position: 'top',
      cssClass: `custom-toast otflow-toast toast-${normalized}`,
      icon,
      mode: 'ios',
      buttons: [
        {
          icon: 'close-outline',
          role: 'cancel',
          side: 'end',
        },
      ],
    });

    await toast.present();
  }

  private normalizeType(type: OtflowToastType): 'success' | 'error' | 'warning' | 'info' {
    if (type === 'danger') {
      return 'error';
    }
    return type;
  }

  private iconForType(type: 'success' | 'error' | 'warning' | 'info'): string {
    switch (type) {
      case 'success':
        return 'checkmark-circle-outline';
      case 'error':
        return 'alert-circle-outline';
      case 'warning':
        return 'warning-outline';
      default:
        return 'information-circle-outline';
    }
  }
}
