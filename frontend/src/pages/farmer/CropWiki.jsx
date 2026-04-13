import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import './cropWiki.css'

const CROP_IMAGES = {
  tomato: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80',
  brinjal: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=400&q=80',
  okra: 'https://images.unsplash.com/photo-1628773822503-930a7eaecf80?w=400&q=80',
  chilli: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=400&q=80',
  onion: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400&q=80',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80',
  cauliflower: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400&q=80',
  cabbage: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&q=80',
  spinach: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80',
  carrot: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80',
  mango: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80',
  banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80',
  papaya: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=400&q=80',
  guava: 'https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=400&q=80',
  watermelon: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80',
  pomegranate: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80',
  coconut: 'https://images.unsplash.com/photo-1580984969071-a8da8e0f6f84?w=400&q=80',
  jackfruit: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400&q=80',
  rice: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&q=80',
  wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
  maize: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=400&q=80',
  groundnut: 'https://images.unsplash.com/photo-1567892737950-30c4db37cd89?w=400&q=80',
  sunflower: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400&q=80',
  cotton: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=400&q=80',
  sugarcane: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80',
  turmeric: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&q=80',
  ginger: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&q=80',
  garlic: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400&q=80',
  mint: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400&q=80',
  'aloe-vera': 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=400&q=80',
  lemon: 'https://images.unsplash.com/photo-1582087677879-6a0d8f6e3e5e?w=400&q=80',
  sapota: 'https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=400&q=80',
  soybean: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&q=80',
  'red-gram': 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&q=80',
  blackgram: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&q=80',
  coriander: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400&q=80',
  fenugreek: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80',
  'curry-leaf': 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400&q=80',
  lemongrass: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400&q=80',
  ashwagandha: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80',
  tulsi: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400&q=80',
  'bitter-gourd': 'https://images.unsplash.com/photo-1628773822503-930a7eaecf80?w=400&q=80',
  'bottle-gourd': 'https://images.unsplash.com/photo-1628773822503-930a7eaecf80?w=400&q=80',
}

const CATEGORY_LABELS = ['All', 'Vegetable', 'Fruit', 'Field Crop', 'Herbs & Spices']

const getCategoryMeta = (category) => {
  switch (category.toLowerCase()) {
    case 'vegetable':
      return { color: '#538d22', icon: 'Veg' }
    case 'fruit':
      return { color: '#a98467', icon: 'Frt' }
    case 'field crop':
      return { color: '#718355', icon: 'Fld' }
    case 'herbs & spices':
      return { color: '#245501', icon: 'Hrb' }
    default:
      return { color: '#6c584c', icon: '-' }
  }
}

export default function CropWiki() {
  const [allCrops, setAllCrops] = useState([])
  const [filteredCrops, setFilteredCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const response = await fetch('/crops.json')
        const data = await response.json()
        if (mounted) {
          setAllCrops(data)
          setFilteredCrops(data)
        }
      } catch {
        if (mounted) {
          setAllCrops([])
          setFilteredCrops([])
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let result = allCrops
    if (activeCategory !== 'All') {
      result = result.filter((crop) => crop.category.toLowerCase() === activeCategory.toLowerCase())
    }
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(
        (crop) =>
          crop.name.toLowerCase().includes(term) ||
          crop.category.toLowerCase().includes(term) ||
          crop.summary.toLowerCase().includes(term)
      )
    }
    setFilteredCrops(result)
  }, [activeCategory, search, allCrops])

  const grouped = useMemo(
    () =>
      filteredCrops.reduce((groups, crop) => {
        const category = crop.category
        if (!groups[category]) groups[category] = []
        groups[category].push(crop)
        return groups
      }, {}),
    [filteredCrops]
  )

  const sortedCategories = ['vegetable', 'fruit', 'field crop', 'herbs & spices'].filter((category) => grouped[category]?.length)

  const switchCategory = (category) => {
    if (category === activeCategory) return
    setVisible(false)
    window.setTimeout(() => {
      setActiveCategory(category)
      setVisible(true)
    }, 160)
  }

  return (
    <Layout showSidebar>
      <div className="crop-wiki">
        <section className="crop-wiki__hero">
          <div className="crop-wiki__eyebrow">Smart Tools</div>
          <h1>Crop Wiki</h1>
          <p>
            Detailed Indian crop profiles with soil type, season, climate, germination timeline, harvest window,
            estimated per-acre cost, cultivation steps, labour needs, and critical watchouts.
          </p>
          <div className="crop-wiki__toolbar">
            <div className="crop-wiki__chips">
              {CATEGORY_LABELS.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => switchCategory(category)}
                  className={`crop-wiki__chip ${activeCategory === category ? 'crop-wiki__chip--active' : ''}`}
                >
                  {category}
                </button>
              ))}
            </div>
            <label className="crop-wiki__search">
              <span className="crop-wiki__search-label">Search crops</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by crop or category"
              />
            </label>
          </div>
        </section>

        <main className={`crop-wiki__content ${visible ? 'is-visible' : 'is-hidden'}`}>
          {loading ? (
            <div className="crop-wiki__loading">
              <div className="crop-wiki__spinner" />
            </div>
          ) : filteredCrops.length > 0 ? (
            sortedCategories.map((category) => {
              const meta = getCategoryMeta(category)
              return (
                <section key={category} className="crop-wiki__group">
                  <div className="crop-wiki__group-header">
                    <span className="crop-wiki__group-icon" style={{ backgroundColor: meta.color }}>
                      {meta.icon}
                    </span>
                    <h2>{category}</h2>
                    <div className="crop-wiki__group-divider" />
                    <span className="crop-wiki__group-count">{grouped[category].length} crops</span>
                  </div>
                  <div className="crop-wiki__grid">
                    {grouped[category].map((crop) => (
                      <Link key={crop.slug} to={`/farmer/crop-wiki/${crop.slug}`} className="crop-card">
                        <div className="crop-card__image-wrap" style={{ backgroundColor: `${meta.color}18` }}>
                          {CROP_IMAGES[crop.slug] ? (
                            <img src={CROP_IMAGES[crop.slug]} alt={crop.name} className="crop-card__image" loading="lazy" />
                          ) : (
                            <div className="crop-card__fallback" style={{ backgroundColor: meta.color }}>
                              {meta.icon}
                            </div>
                          )}
                        </div>
                        <div className="crop-card__body">
                          <div className="crop-card__title-row">
                            <h3>{crop.name}</h3>
                            <span className="crop-card__slug">{crop.slug}</span>
                          </div>
                          <p className="crop-card__summary">{crop.summary}</p>
                          <div className="crop-card__quickfacts">
                            <div>
                              <span>Soil</span>
                              <strong>{crop.conditions?.soil || '--'}</strong>
                            </div>
                            <div>
                              <span>Season</span>
                              <strong>{crop.conditions?.season || '--'}</strong>
                            </div>
                            <div>
                              <span>Harvest</span>
                              <strong>{crop.time?.harvest_days ?? '--'} days</strong>
                            </div>
                          </div>
                          <div className="crop-card__footer">
                            <span>Tap to open profile</span>
                            <span>{crop.time?.germination_days ?? '--'}d germination</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )
            })
          ) : (
            <div className="crop-wiki__empty">
              <h3>No results for "{search}"</h3>
              <p>Try a different search term or reset the filters.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setActiveCategory('All')
                }}
              >
                Reset filters
              </button>
            </div>
          )}
        </main>
      </div>
    </Layout>
  )
}
