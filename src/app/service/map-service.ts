import { AfterViewInit, Injectable } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class MapService {
  private map!: mapboxgl.Map;

  constructor() {}

  // Initialise la carte

  initMap(
    containerId: string,
    center: [number, number],
    zoom: number = 10
  ): mapboxgl.Map {
    this.map = new mapboxgl.Map({
      container: containerId,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: zoom,
      accessToken: environment.mapbox.accessToken,
    });

    this.map.addControl(new mapboxgl.NavigationControl());
    return this.map;
  }
  // Ajoute un Marker
  addMarker(lng: number, lat: number, popupText?: string) {
    const marker = new mapboxgl.Marker().setLngLat([lng, lat]);

    if (popupText) {
      const popup = new mapboxgl.Popup({ offset: 25 }).setText(popupText);
      marker.setPopup(popup);
    }

    marker.addTo(this.map);
  }

  getMap(): mapboxgl.Map {
    return this.map;
  }
}
