declare module 'latlon-geohash' {
  export function encode(lat: number, lon: number, precision?: number): string;
  export function decode(hash: string): { lat: number; lon: number };
  export function adjacent(hash: string, direction: string): string;
  export function neighbours(hash: string): string[];
}