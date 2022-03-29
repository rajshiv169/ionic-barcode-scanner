import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { ToastController } from '@ionic/angular';
import { Clipboard } from '@capacitor/clipboard';

@Component({
  selector: 'app-barcode-scanner',
  templateUrl: './barcode-scanner.component.html',
  styleUrls: ['./barcode-scanner.component.scss'],
})
export class BarcodeScannerComponent implements OnInit, AfterViewInit, OnDestroy {

  result = null;
  scanActive = false;

  constructor(public alertController: AlertController,
    public actionSheetController: ActionSheetController,
    public toastController: ToastController) { }

  ngOnInit() {}

  ngAfterViewInit() {
    BarcodeScanner.prepare();
  }

  ngOnDestroy() {
    BarcodeScanner.stopScan();
  }

  async startScanner() {
    const allowed = await this.checkPermission();
    if(allowed) {
      this.scanActive = true;
      const result = await BarcodeScanner.startScan();
      if(result.hasContent) {
        this.scanActive = false;
        this.copyData(result.content);
        this.result = result.content;
      }
    }
  }

  async checkPermission() {
    const status = await BarcodeScanner.checkPermission({force:true});
    return new Promise(async (resolve, reject) => {
      if (status.granted) {
        resolve(true);
      } else if(status.denied) {
        const alert = await this.alertController.create({
          header: 'No Permission',
          message: 'Please allow camera access in your settings',
          buttons: [{
            text: 'No',
            role: 'Cancel'
          }, {
            text: 'Open Settings',
            handler: () => {
              BarcodeScanner.openAppSettings();
              resolve(false);
            }
          }]
        });
      } else {
        resolve(false);
      }
    });
  }

  stopScanner() {
    BarcodeScanner.stopScan();
    this.scanActive = false;
  }

  async copyData(data) {
    const actionSheet = await this.actionSheetController.create({
      header: `${data}`,
      buttons: [
        {
          text: 'Copy',
          icon: 'clipboard-outline',
          handler: () => {
            Clipboard.write({
              string: `${data}`
            });
          },
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();

    return new Promise(async (resolve, reject) => {
      const { role } = await actionSheet.onDidDismiss();
      if(role !== 'cancel' || role === undefined) {
        const toast = await this.toastController.create({
          message: 'Copied!',
          duration: 2000,
        });
        toast.present();
        resolve(true);
      }
    });
  }
}
