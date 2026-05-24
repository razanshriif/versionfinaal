import { Injectable } from '@angular/core';
import { AlertController, AlertButton } from '@ionic/angular';

export interface OtflowAlertButton {
  text: string;
  role?: 'cancel' | 'destructive' | string;
  cssClass?: string;
  handler?: () => boolean | void | Promise<boolean | void>;
}

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private readonly alertCssClass = 'custom-alert otflow-alert';

  constructor(private alertController: AlertController) {}

  async confirm(options: {
    header: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
  }): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: options.header,
        message: options.message,
        cssClass: this.alertCssClass,
        backdropDismiss: false,
        mode: 'ios',
        buttons: [
          {
            text: options.cancelText ?? 'Annuler',
            role: 'cancel',
            cssClass: 'alert-button-cancel',
            handler: () => resolve(false),
          },
          {
            text: options.confirmText ?? 'Confirmer',
            cssClass: options.destructive
              ? 'alert-button-destructive'
              : 'alert-button-confirm',
            handler: () => resolve(true),
          },
        ],
      });
      await alert.present();
    });
  }

  async present(options: {
    header: string;
    message: string;
    subHeader?: string;
    buttons: OtflowAlertButton[];
    backdropDismiss?: boolean;
    cssClass?: string | string[];
  }): Promise<void> {
    const buttons: AlertButton[] = options.buttons.map((btn) => ({
      text: btn.text,
      role: btn.role,
      cssClass: btn.cssClass ?? this.buttonClassForRole(btn.role),
      handler: btn.handler,
    }));

    const extraClass = options.cssClass
      ? Array.isArray(options.cssClass)
        ? options.cssClass
        : [options.cssClass]
      : [];

    const alert = await this.alertController.create({
      header: options.header,
      subHeader: options.subHeader,
      message: options.message,
      cssClass: [this.alertCssClass, ...extraClass],
      backdropDismiss: options.backdropDismiss ?? false,
      mode: 'ios',
      buttons,
    });
    await alert.present();
  }

  private buttonClassForRole(role?: string): string {
    if (role === 'cancel') {
      return 'alert-button-cancel';
    }
    if (role === 'destructive') {
      return 'alert-button-destructive';
    }
    return 'alert-button-confirm';
  }
}
