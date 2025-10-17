import { AfterViewInit, Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { MapService } from '../service/map-service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent]
})
export class Tab2Page implements AfterViewInit {


  constructor(private mapService:MapService) {}

  ngAfterViewInit(): void {
      const map = this.mapService.initMap('map', [5.3698, 43.2965], 12);

      // Ajouter un Marqueur
      this.mapService.addMarker(5.3698, 43.2965, 'Marseille');
  }

}
