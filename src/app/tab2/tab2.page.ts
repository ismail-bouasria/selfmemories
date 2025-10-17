import { AfterViewInit, Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, LoadingController } from '@ionic/angular/standalone';
import { MapService } from '../service/map-service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent]
})
export class Tab2Page implements AfterViewInit {

  constructor(
    private mapService: MapService,
    private loadingCtrl: LoadingController
  ) {}

  async ngAfterViewInit(): Promise<void> {
    // Affiche le loader
    const loading = await this.loadingCtrl.create({
      message: 'Chargement de la carte...',
      spinner: 'crescent',
      backdropDismiss: false
    });
    await loading.present();

    //  Initialise la carte
    await this.mapService.initMap('map', [43.5297, 5.4474], 12);

    // Ferme le loader quand la carte est prête
    await loading.dismiss();
  }
}
