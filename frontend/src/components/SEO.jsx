import { Helmet } from 'react-helmet-async'

const SEO = ({ 
  title, 
  description, 
  keywords = '', 
  ogImage = '',
  ogType = 'website',
  canonicalUrl = '',
  noIndex = false,
  structuredData = null
}) => {
  const siteTitle = 'Farm to Table - Fresh Produce Direct from Local Farmers'
  const siteDescription = 'Connect with local farmers and buy fresh, organic produce directly. Support sustainable agriculture and get farm-fresh products delivered to your doorstep.'
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://farmtotable.com'

  const finalTitle = title ? `${title} | ${siteTitle}` : siteTitle
  const finalDescription = description || siteDescription
  const finalCanonical = canonicalUrl || siteUrl

  const jsonLd = structuredData || {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteTitle,
    "description": siteDescription,
    "url": siteUrl
  }

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={keywords} />
      
      <link rel="canonical" href={finalCanonical} />
      
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph Tags */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={finalCanonical} />
      <meta property="og:image" content={ogImage || `${siteUrl}/og-image.jpg`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={ogImage || `${siteUrl}/twitter-image.jpg`} />
      
      {/* Additional Meta Tags */}
      <meta name="author" content="Farm to Table" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta charSet="utf-8" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </Helmet>
  )
}

export default SEO
