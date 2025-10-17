import { Injectable } from '@angular/core';
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { AlertController } from '@ionic/angular';
import {
  NativeSettings,
  IOSSettings,
  AndroidSettings,
} from 'capacitor-native-settings';
import { Platform } from '@ionic/angular';
import { GeolocationService } from '../service/geolocation-service';

// Interface UserPhoto
export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
  liked?: boolean;
  coords?: { latitude: number; longitude: number }; // optionnel si tu veux la position
  address?: string; // optionnel si tu veux l’adresse
}

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  public photos: UserPhoto[] = [];
  private PHOTO_STORAGE: string = 'photos';

  constructor(
    private platform: Platform,
    private alertCtrl: AlertController,
    private geolocationService: GeolocationService
  ) {}

  // Supprime une photo: fichier + tableau + preferences
  public async deletePhoto(photo: UserPhoto): Promise<boolean> {
    try {
      // 1) Supprime le fichier du filesystem (si présent)
      if (photo.filepath) {
        try {
          await Filesystem.deleteFile({
            path: photo.filepath,
            directory: Directory.Data,
          });
          console.log('Fichier supprimé :', photo.filepath);
        } catch (fsErr) {
          // Sur web Directory.Data peut ne pas contenir le fichier → log, mais on continue
          console.warn('Impossible de supprimer le fichier (peut-être web):', fsErr);
        }
      }

      // 2) Retire la photo du tableau
      this.photos = this.photos.filter(p => p.filepath !== photo.filepath);

      // 3) Met à jour le storage
      await Preferences.set({
        key: this.PHOTO_STORAGE,
        value: JSON.stringify(this.photos),
      });

      console.log('Photo supprimée de la liste et storage mis à jour.');
      return true;
    } catch (err) {
      console.error('Erreur deletePhoto:', err);
      return false;
    }
  }


  // Méthode pour ouvrir les réglages si la caméra est refusée
  async openAppSettings() {
    if (this.platform.is('ios')) {
      await NativeSettings.openIOS({ option: IOSSettings.App });
    } else if (this.platform.is('android')) {
      await NativeSettings.openAndroid({
        option: AndroidSettings.ApplicationDetails,
      });
    } else {
      await this.alertCtrl.create({
        header: 'Permission refusée',
        message: 'Impossible d’ouvrir les réglages sur cette plateforme.',
        buttons: ['OK'],
      });
    }
  }

  // Vérifie la permission avant de prendre une photo
  async checkCameraPermission(): Promise<boolean> {
    try {
      const permission = await Camera.checkPermissions();

      if (permission.camera === 'granted') {
        return true;
      } else if (permission.camera === 'denied') {
        const openSettings = confirm(
          "L'accès à la caméra est refusé. Voulez-vous ouvrir les réglages pour l'autoriser ?"
        );
        if (openSettings) {
          await this.openAppSettings();
        }
        return false;
      } else {
        // Demande la permission
        const request = await Camera.requestPermissions({
          permissions: ['camera'],
        });
        return request.camera === 'granted';
      }
    } catch (err) {
      console.error('Erreur permission caméra :', err);
      return false;
    }
  }

  public async toggleLike(photo: UserPhoto) {
    photo.liked = !photo.liked;

    // Sauvegarde la modification
    await Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });
  }

  
  // Function to take a photo
  public async addNewToGallery() {
    const hasPermission = await this.checkCameraPermission();
    if (!hasPermission) return;
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100,
    });

    // 🌍 Récupère coords + adresse via ton nouveau service
    const { coords, address } = await this.geolocationService.getLocationData();

    // Save the picture and add it to photo collection
    const savedImageFile = (await this.savePicture(capturedPhoto)) as UserPhoto;

    // Ajoute la propriété liked = false par défaut
    savedImageFile.liked = false;

    // Condition de la localisation de l'image
    if (coords) savedImageFile.coords = coords;
    if (address) savedImageFile.address = address;

    this.photos.unshift(savedImageFile);
    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });
  }
  
  // Function to save Picture

  private async savePicture(photo: Photo): Promise<UserPhoto> {
    // Convert photo to base64 format, required by Filesystem API to save
    const base64Data = await this.readAsBase64(photo);

    // Write the file to the data directory
    const fileName = Date.now() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    // Use webPath to display the new image instead of base64 since it's
    // already loaded into memory
    return {
      filepath: fileName,
      webviewPath: photo.webPath,
      liked: false,
      //coords:{latitude:'',longitude:''},
      //address: '',
    };
  }


  private async readAsBase64(photo: Photo) {
    // Fetch the photo, read as a blob, then convert to base64 format
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();

    return (await this.convertBlobToBase64(blob)) as string;
  }

  private convertBlobToBase64 = (blob: Blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });

  // Function to load picture Saved
  public async loadSaved() {
    // Retrieve cached photo array data
    const { value } = await Preferences.get({ key: this.PHOTO_STORAGE });
    this.photos = (value ? JSON.parse(value) : []) as UserPhoto[];

    // Display the photo by reading into base64 format
    for (let photo of this.photos) {
      // Read each saved photo's data from the Filesystem
      const readFile = await Filesystem.readFile({
        path: photo.filepath,
        directory: Directory.Data,
      });

      // Web platform only: Load the photo as base64 data
      photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
    }
  }
}
