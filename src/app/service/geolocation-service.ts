import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private readonly MAPBOX_TOKEN = environment.mapbox.accessToken;
 constructor(){}

 //  Obtenir les coordonnées actuelles
  async getCurrentCoords(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const position = await Geolocation.getCurrentPosition();
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (err) {
      console.warn('Erreur lors de la récupération de la position :', err);
      return null;
    }
  
}


  // Convertir coordonnées → adresse via Mapbox
  async getAddressFromCoords(lat: number, lng: number): Promise<string | null> {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${this.MAPBOX_TOKEN}&limit=1&types=address,place,locality`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn('Erreur Mapbox:', res.status);
        return null;
      }
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        console.log('Adresse trouvée:', data);
        return data.features[0].place_name;
      }
      return null;
    } catch (err) {
      console.error('Erreur reverse geocoding:', err);
      return null;
    }
  }

  // Fonction combinée : récupère coords + adresse
  async getLocationData(): Promise<{
    coords: { latitude: number; longitude: number } | null;
    address: string | null;
  }> {
    const coords = await this.getCurrentCoords();
    let address: string | null = null;

    if (coords) {
      address = await this.getAddressFromCoords(coords.latitude, coords.longitude);
    }

    return { coords, address };
  }
}


