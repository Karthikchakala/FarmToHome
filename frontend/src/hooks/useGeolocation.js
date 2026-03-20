import { useState, useEffect, useCallback } from 'react'

// Custom hook for geolocation functionality
export const useGeolocation = () => {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [permission, setPermission] = useState('prompt')

  // Check browser support
  const isSupported = 'geolocation' in navigator

  // Check permission status
  const checkPermission = useCallback(() => {
    if (!isSupported) {
      setError('Geolocation is not supported by your browser')
      return false
    }

    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(result => {
          setPermission(result.state)
          if (result.state === 'denied') {
            setError('Location access denied. Please enable location in your browser settings.')
          }
        })
        .catch(() => {
          // Fallback for browsers that don't support permissions API
          setPermission('prompt')
        })
    }
    return true
  }, [isSupported])

  // Get current position
  const getCurrentPosition = useCallback((options = {}) => {
    if (!isSupported) {
      setError('Geolocation is not supported by your browser')
      return Promise.reject(new Error('Geolocation not supported'))
    }

    setLoading(true)
    setError(null)

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
      ...options
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          }

          setLocation(locationData)
          setLoading(false)
          setPermission('granted')
          resolve(locationData)
        },
        (error) => {
          setLoading(false)
          let errorMessage = 'Unable to retrieve your location'

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location in your browser settings.'
              setPermission('denied')
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.'
              break
            case error.UNKNOWN_ERROR:
              errorMessage = 'An unknown error occurred while retrieving location.'
              break
            default:
              errorMessage = 'Unable to retrieve your location.'
          }

          setError(errorMessage)
          reject(new Error(errorMessage))
        },
        defaultOptions
      )
    })
  }, [isSupported])

  // Watch position (continuous updates)
  const watchPosition = useCallback((callback, options = {}) => {
    if (!isSupported) {
      setError('Geolocation is not supported by your browser')
      return null
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // 1 minute for watching
      ...options
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        }

        setLocation(locationData)
        setPermission('granted')
        setError(null)
        callback(locationData)
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location'

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied.'
            setPermission('denied')
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
          default:
            errorMessage = 'Unable to retrieve your location.'
        }

        setError(errorMessage)
      },
      defaultOptions
    )

    return watchId
  }, [isSupported])

  // Stop watching position
  const clearWatch = useCallback((watchId) => {
    if (watchId !== null && isSupported) {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [isSupported])

  // Request permission
  const requestPermission = useCallback(() => {
    if (!isSupported) {
      setError('Geolocation is not supported by your browser')
      return Promise.reject(new Error('Geolocation not supported'))
    }

    return getCurrentPosition()
      .then((locationData) => {
        setPermission('granted')
        return locationData
      })
      .catch((error) => {
        setPermission('denied')
        throw error
      })
  }, [isSupported, getCurrentPosition])

  // Calculate distance between two points
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }, [])

  // Check if within radius
  const isWithinRadius = useCallback((centerLat, centerLng, targetLat, targetLng, radiusKm = 8) => {
    const distance = calculateDistance(centerLat, centerLng, targetLat, targetLng)
    return distance <= radiusKm
  }, [calculateDistance])

  // Get address from coordinates (using reverse geocoding)
  const reverseGeocode = useCallback(async (latitude, longitude) => {
    try {
      // This would use a real geocoding service in production
      // For now, return a mock address
      const mockAddress = {
        home: '123',
        street: 'Main Street',
        landmark: 'Near Park',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        latitude,
        longitude
      }
      
      return mockAddress
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return null
    }
  }, [])

  // Get coordinates from address (using geocoding)
  const geocodeAddress = useCallback(async (address) => {
    try {
      // This would use a real geocoding service in production
      // For now, return mock coordinates
      const mockCoordinates = {
        latitude: 12.9716 + (Math.random() - 0.5) * 0.1,
        longitude: 77.5946 + (Math.random() - 0.5) * 0.1
      }
      
      return mockCoordinates
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }, [])

  // Initialize on mount
  useEffect(() => {
    checkPermission()
  }, [checkPermission])

  return {
    location,
    error,
    loading,
    permission,
    isSupported,
    getCurrentPosition,
    watchPosition,
    clearWatch,
    requestPermission,
    calculateDistance,
    isWithinRadius,
    reverseGeocode,
    geocodeAddress
  }
}
