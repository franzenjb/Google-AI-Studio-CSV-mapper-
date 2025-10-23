export interface CsvRow {
  [key: string]: string;
}

export interface CsvData {
  headers: string[];
  rows: CsvRow[];
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  data: CsvRow;
}

export interface Geolocation {
    lat: number;
    lng: number;
}

export interface GeocodedLocation {
  location: string;
  lat: number;
  lng: number;
}

export type Theme = 'light' | 'dark';
