// Location utilities for distance calculations and geolocation

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

// Convert degrees to radians
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Check if a point is within a given radius
const isWithinRadius = (lat1, lon1, lat2, lon2, radiusKm = 8) => {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= radiusKm;
};

// Validate coordinates
const validateCoordinates = (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  if (isNaN(lat) || isNaN(lng)) {
    return false;
  }
  
  if (lat < -90 || lat > 90) {
    return false;
  }
  
  if (lng < -180 || lng > 180) {
    return false;
  }
  
  return true;
};

// Format coordinates for database storage
const formatCoordinates = (latitude, longitude) => {
  return {
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude)
  };
};

// Parse location from database
const parseLocation = (locationData) => {
  if (!locationData) return null;
  
  if (typeof locationData === 'string') {
    try {
      const parsed = JSON.parse(locationData);
      return formatCoordinates(parsed.latitude, parsed.longitude);
    } catch {
      return null;
    }
  }
  
  if (typeof locationData === 'object') {
    if (locationData.lat && locationData.lng) {
      return formatCoordinates(locationData.lat, locationData.lng);
    }
    if (locationData.latitude && locationData.longitude) {
      return formatCoordinates(locationData.latitude, locationData.longitude);
    }
  }
  
  return null;
};

// Create location object for database
const createLocationObject = (latitude, longitude) => {
  return JSON.stringify({
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude)
  });
};

// Get bounding box for a given radius (for database queries)
const getBoundingBox = (latitude, longitude, radiusKm = 8) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  // Approximate degrees per kilometer
  const latDelta = radiusKm / 111; // 1 degree latitude ≈ 111 km
  const lngDelta = radiusKm / (111 * Math.cos(toRadians(lat))); // Varies by latitude
  
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta
  };
};

// Validate address components
const validateAddress = (address) => {
  const errors = {};
  
  if (!address.home || address.home.trim().length < 1) {
    errors.home = 'House/Flat number is required';
  }
  
  if (!address.street || address.street.trim().length < 3) {
    errors.street = 'Street address is required (min 3 characters)';
  }
  
  if (!address.city || address.city.trim().length < 2) {
    errors.city = 'City is required (min 2 characters)';
  }
  
  if (!address.state || address.state.trim().length < 2) {
    errors.state = 'State is required (min 2 characters)';
  }
  
  if (!address.pincode || !/^[1-9][0-9]{5}$/.test(address.pincode)) {
    errors.pincode = 'Valid pincode is required (6 digits)';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Format address for display
const formatAddress = (address) => {
  if (!address) return '';
  
  const parts = [
    address.home,
    address.street,
    address.landmark,
    address.city,
    address.state,
    address.pincode
  ].filter(Boolean);
  
  return parts.join(', ');
};

// Calculate delivery charge based on distance
const calculateDeliveryCharge = (distanceKm) => {
  if (distanceKm <= 3) {
    return 0; // Free delivery within 3km
  } else if (distanceKm <= 5) {
    return 20; // ₹20 for 3-5km
  } else if (distanceKm <= 8) {
    return 40; // ₹40 for 5-8km
  } else {
    return 60; // ₹60 for >8km (if allowed)
  }
};

// Get delivery time estimate based on distance
const getDeliveryTimeEstimate = (distanceKm) => {
  if (distanceKm <= 2) {
    return '30-45 min';
  } else if (distanceKm <= 5) {
    return '45-60 min';
  } else if (distanceKm <= 8) {
    return '60-90 min';
  } else {
    return '90-120 min';
  }
};

// Geocode address to coordinates (mock implementation - would use real geocoding API)
const geocodeAddress = async (address) => {
  // This is a mock implementation
  // In production, you would use Google Maps API, OpenStreetMap Nominatim, etc.
  return new Promise((resolve, reject) => {
    // Simulate API call
    setTimeout(() => {
      // Mock coordinates for demonstration
      const mockCoordinates = {
        latitude: 12.9716 + (Math.random() - 0.5) * 0.1,
        longitude: 77.5946 + (Math.random() - 0.5) * 0.1
      };
      
      resolve(mockCoordinates);
    }, 1000);
  });
};

// Reverse geocode coordinates to address (mock implementation)
const reverseGeocode = async (latitude, longitude) => {
  // This is a mock implementation
  // In production, you would use Google Maps API, OpenStreetMap Nominatim, etc.
  return new Promise((resolve, reject) => {
    // Simulate API call
    setTimeout(() => {
      const mockAddress = {
        home: '123',
        street: 'Main Street',
        landmark: 'Near Park',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001'
      };
      
      resolve(mockAddress);
    }, 1000);
  });
};

module.exports = {
  calculateDistance,
  isWithinRadius,
  validateCoordinates,
  formatCoordinates,
  parseLocation,
  createLocationObject,
  getBoundingBox,
  validateAddress,
  formatAddress,
  calculateDeliveryCharge,
  getDeliveryTimeEstimate,
  geocodeAddress,
  reverseGeocode,
  toRadians
};
