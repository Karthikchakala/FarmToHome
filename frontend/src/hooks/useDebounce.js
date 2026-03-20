import { useState, useEffect } from 'react'

// Custom hook for debouncing values
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Custom hook for debounced callback
export const useDebouncedCallback = (callback, delay) => {
  const [debouncedCallback, setDebouncedCallback] = useState(null)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCallback(() => callback)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [callback, delay])

  return debouncedCallback
}

// Custom hook for debounced search with loading state
export const useDebouncedSearch = (searchFunction, delay = 300) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const debouncedSearch = useDebouncedCallback(async (...args) => {
    try {
      setIsLoading(true)
      setError(null)
      await searchFunction(...args)
    } catch (err) {
      setError(err.message || 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }, delay)

  return {
    debouncedSearch,
    isLoading,
    error
  }
}
