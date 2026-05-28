declare module 'latlon-geohash' {
  const Geohash: {
    encode(lat: number, lon: number, precision?: number): string;
    decode(hash: string): { lat: number; lon: number };
    adjacent(hash: string, direction: string): string;
    neighbours(hash: string): string[];
  };
  export default Geohash;
}