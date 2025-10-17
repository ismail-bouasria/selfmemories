import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { PhotoService, UserPhoto } from '../service/photo-service';
import { IonHeader, IonToolbar, IonToolbar as IonToolbar_1, IonContent, IonTitle } from '@ionic/angular/standalone'; 

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
  imports: [IonTitle, IonHeader, IonToolbar, IonToolbar_1, IonContent, CommonModule], 
})
export class Tab3Page implements OnInit {
  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  allPhotos: UserPhoto[] = [];
  photosByCity: { [city: string]: UserPhoto[] } = {};

  constructor(private photoService: PhotoService) {}

  async ngOnInit() {
    // Charger les photos enregistrées
    await this.photoService.loadSaved();
    this.allPhotos = this.photoService.photos;

    // Regrouper par ville
    this.photosByCity = this.groupPhotosByCity(this.allPhotos);
  }

  private groupPhotosByCity(photos: UserPhoto[]): { [city: string]: UserPhoto[] } {
    const groups: { [city: string]: UserPhoto[] } = {};
    photos.forEach(photo => {
      const city = photo.address || 'Inconnue';
      if (!groups[city]) groups[city] = [];
      groups[city].push(photo);
    });
    return groups;
  }
}
