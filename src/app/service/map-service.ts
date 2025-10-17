import { Injectable } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { environment } from 'src/environments/environment';
import { PhotoService, UserPhoto } from './photo-service';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private map!: mapboxgl.Map;

  constructor(private photoService: PhotoService) {}

  /**
   * Initialise la carte et charge les photos avec clustering
   */
  initMap(containerId: string, center: [number, number], zoom: number = 12): Promise<mapboxgl.Map> {
    return new Promise<mapboxgl.Map>((resolve) => {
      this.map = new mapboxgl.Map({
        container: containerId,
        style: 'mapbox://styles/mapbox/streets-v12',
        center:[5.4474, 43.5297],
        zoom :12,
        accessToken: environment.mapbox.accessToken
      });

      this.map.addControl(new mapboxgl.NavigationControl());

      // ⚡ Attendre que le style soit chargé
      this.map.on('load', async () => {
        try {
          await this.loadPhotoMarkersWithCluster();
          resolve(this.map);
        } catch (err) {
          console.error('Erreur lors du chargement des markers:', err);
          resolve(this.map);
        }
      });
    });
  }

  /**
   * Ajoute un marker classique avec popup optionnel
   */
  addMarker(lng: number, lat: number) {
    const marker = new mapboxgl.Marker().setLngLat([lng, lat]);
    marker.addTo(this.map);
  }

  /**
   * Charge les photos sauvegardées et crée les clusters + markers HTML
   */
  private async loadPhotoMarkersWithCluster() {
    await this.photoService.loadSaved();
    const photosWithCoords = this.photoService.photos.filter(p => p.coords);
    if (!photosWithCoords.length) return;

    // ✅ Création du GeoJSON typé
    const geojson: GeoJSON.FeatureCollection<GeoJSON.Point, { [key: string]: any }> = {
      type: 'FeatureCollection',
      features: photosWithCoords.map(p => ({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [p.coords!.longitude, p.coords!.latitude]
        }
      }))
    };

    // 1️⃣ Source GeoJSON avec clustering
    this.map.addSource('photos', {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: 50,
      clusterRadius: 300
    });

    // 2️⃣ Layer pour les clusters (cercles)
    this.map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'photos',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#f28cb1',
        'circle-radius': ['step', ['get', 'point_count'], 30, 15, 40, 20, 50]
      }
    });

    // 3️⃣ Layer pour le nombre de points dans le cluster
    this.map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'photos',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      }
    });

    // Layer pour les points non-clusterisés
this.map.addLayer({
  id: 'unclustered-point',
  type: 'symbol',
  source: 'photos',
  filter: ['!', ['has', 'point_count']],
  layout: {
    'icon-image': 'default-marker',
    'icon-size': 0.2,
    'icon-allow-overlap': true
  }
});

    // Éclater un cluster au clic
this.map.on('click', 'clusters', (e) => {
  const features = this.map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
  if (!features.length) return;

  // ⚡ Utiliser la syntaxe crochet pour accéder à cluster_id
  const properties = features[0].properties;
  if (!properties) return;
  const clusterId = properties['cluster_id'];

  (this.map.getSource('photos') as any).getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
    if (err) return;

    this.map.easeTo({
      center: (features[0].geometry as any).coordinates,
      zoom: zoom
    });
  });
});


    // 4️⃣ Markers HTML pour les photos individuelles
    for (const photo of photosWithCoords) {
      const el = document.createElement('div');
      el.className = 'photo-marker';
      el.style.backgroundImage = `url(${photo.webviewPath})`;
      el.style.width = '50px';
      el.style.height = '50px';
      el.style.backgroundSize = 'cover';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([photo.coords!.longitude, photo.coords!.latitude]);


      marker.addTo(this.map);
    }
  }
}
