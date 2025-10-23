import { CsvRow } from '../types';

/**
 * Tries to automatically detect latitude and longitude columns from a list of headers.
 * @param headers An array of strings representing the CSV headers.
 * @returns An object with the detected lat and lng header names, or null if not found.
 */
export const detectLatLngColumns = (headers: string[]): { lat: string | null; lng: string | null } => {
  const latPatterns = [/lat/i, /latitude/i];
  const lngPatterns = [/lon/i, /lng/i, /longitude/i];

  let lat: string | null = null;
  let lng: string | null = null;

  for (const header of headers) {
    if (!lat && latPatterns.some(pattern => pattern.test(header))) {
      lat = header;
    }
    if (!lng && lngPatterns.some(pattern => pattern.test(header))) {
      lng = header;
    }
  }

  return { lat, lng };
};

/**
 * Extracts the unique values from a specific column in the CSV data.
 * @param rows An array of CsvRow objects.
 * @param column The header of the column to extract unique values from.
 * @returns A sorted array of unique string values.
 */
export const getUniqueColumnValues = (rows: CsvRow[], column: string): string[] => {
    const valueSet = new Set<string>();
    rows.forEach(row => {
        if(row[column]) {
            valueSet.add(row[column]);
        }
    });
    return Array.from(valueSet).sort();
}

/**
 * Generates a consistent hex color from a string input.
 * @param str The input string (e.g., a category name).
 * @returns A hex color string.
 */
export const getColorFromString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }

  return color;
};
