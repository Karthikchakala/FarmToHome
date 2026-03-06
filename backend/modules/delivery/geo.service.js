import { query } from '../../src/config/db.js';

/**
 * Builds a PostGIS Point from longitude and latitude.
 * PostGIS format is SRID=4326;POINT(lon lat)
 */
export const makePoint = (lon, lat) => `SRID=4326;POINT(${lon} ${lat})`;

/**
 * Builds a PostGIS Polygon from an array of coordinate objects.
 * PostGIS polygons must be closed (first and last point must be same).
 */
export const makePolygon = (coordsArray) => {
    if (!coordsArray || coordsArray.length < 3) return null;
    // Ensure the polygon is closed
    const points = [...coordsArray];
    const first = points[0];
    const last = points[points.length - 1];
    if (first.longitude !== last.longitude || first.latitude !== last.latitude) {
        points.push(first);
    }
    const pointString = points.map(p => `${p.longitude} ${p.latitude}`).join(', ');
    return `SRID=4326;POLYGON((${pointString}))`;
};

/**
 * Parse a PostGIS Point EWKB back into lat/long
 * Format expected: 0101000020E6100000X...Y... (Hex) or sometimes direct object if pg translates it.
 * But we'll use ST_X and ST_Y in our SELECT queries directly to avoid manual parsing.
 */

