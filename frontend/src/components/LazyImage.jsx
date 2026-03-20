import { useState, useRef, useEffect } from 'react'
import './LazyImage.css'

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = '/placeholder.jpg',
  fallback = '/fallback.jpg',
  onLoad = null,
  onError = null,
  loading = 'lazy',
  sizes = null,
  srcSet = null
}) => {
  const [imageState, setImageState] = useState('loading') // loading, loaded, error
  const [currentSrc, setCurrentSrc] = useState(placeholder)
  const imgRef = useRef(null)
  const observerRef = useRef(null)

  useEffect(() => {
    const img = imgRef.current
    if (!img) return

    // Create intersection observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Start loading the actual image
            const newImg = new Image()
            
            newImg.onload = () => {
              setCurrentSrc(src)
              setImageState('loaded')
              onLoad?.()
            }
            
            newImg.onerror = () => {
              setCurrentSrc(fallback)
              setImageState('error')
              onError?.()
            }
            
            newImg.src = src
            
            // Stop observing once image starts loading
            observer.unobserve(img)
          }
        })
      },
      {
        root: null,
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    )

    observerRef.current = observer
    observer.observe(img)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [src, fallback, onLoad, onError])

  const handleError = () => {
    if (currentSrc !== fallback) {
      setCurrentSrc(fallback)
      setImageState('error')
      onError?.()
    }
  }

  return (
    <div className={`lazy-image-container ${className}`}>
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`lazy-image ${imageState}`}
        onError={handleError}
        loading={loading}
        sizes={sizes}
        srcSet={srcSet}
      />
      {imageState === 'loading' && (
        <div className="lazy-image-placeholder">
          <div className="lazy-image-spinner"></div>
        </div>
      )}
      {imageState === 'error' && (
        <div className="lazy-image-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">Failed to load image</span>
        </div>
      )}
    </div>
  )
}

export default LazyImage
