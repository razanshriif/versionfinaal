import { Injectable } from '@angular/core';
import { ToastController, ToastOptions } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, alertCircleOutline, informationCircleOutline, warningOutline } from 'ionicons/icons';

@Injectable({
    providedIn: 'root'
})
export class ToastService {

    constructor(private toastController: ToastController) {
        addIcons({ checkmarkCircleOutline, alertCircleOutline, informationCircleOutline, warningOutline });
    }

    async show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 3000) {
        let color = 'primary';
        let icon = 'information-circle-outline';

        switch (type) {
            case 'success':
                color = 'success';
                icon = 'checkmark-circle-outline';
                break;
            case 'error':
                color = 'danger';
                icon = 'alert-circle-outline';
                break;
            case 'warning':
                color = 'warning';
                icon = 'warning-outline';
                break;
            case 'info':
            default:
                color = 'tertiary';
                icon = 'information-circle-outline';
                break;
        }

        const toast = await this.toastController.create({
            message: message,
            duration: duration,
            color: color,
            icon: icon,
            position: 'top',
            cssClass: `custom-toast toast-${type}`,
            buttons: [
                {
                    icon: 'close',
                    role: 'cancel'
                }
            ]
        });

        await toast.present();
    }
}

