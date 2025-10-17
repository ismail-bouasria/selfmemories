import { Component, ViewChild,ElementRef } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFabButton,
  IonFab,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonImg, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonButton } from '@ionic/angular/standalone';
import { PhotoService } from '../service/photo-service';
import { createAnimation } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { heart } from 'ionicons/icons';
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [IonButton, IonCardContent, IonCardSubtitle, IonCardTitle, IonCardHeader, IonCard, 
    IonImg,
    IonCol,
    IonRow,
    IonGrid,
    IonIcon,
    IonFab,
    IonFabButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
  ],
})
export class Tab1Page {
  
  constructor(public photoService: PhotoService) {
    addIcons({ heart });
  }


  @ViewChild('heart', { read: ElementRef }) heart!: ElementRef;
  liked = false;

  like() {
    this.liked = !this.liked;

    // Crée l'animation
    const animation = createAnimation()
      .addElement(this.heart.nativeElement)
      .duration(300)
      .iterations(1)
      .keyframes([
        { offset: 0, transform: 'scale(1)' },
        { offset: 0.5, transform: 'scale(1.5)' },
        { offset: 1, transform: 'scale(1)' },
      ]);

    animation.play();
  }

  async ngOnInit() {
    await this.photoService.loadSaved();
  }

  addPhotoToGallery() {
    this.photoService.addNewToGallery();
  }
}
