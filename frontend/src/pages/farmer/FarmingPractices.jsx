import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import { PRACTICES, toSlug, diffStyle, costSymbol } from './farmingPracticesData'
import './farmingPractices.css'

function PracticeCard({ practice, cat }) {
  const diff = diffStyle(practice.difficulty)

  return (
    <Link to={`/farmer/farming-practices/${toSlug(practice.name)}`} className="farming-practices__card-link">
      <article className="farming-practices__card" style={{ borderColor: `${cat.cardBorder}30` }}>
        <div className="farming-practices__card-strip" style={{ backgroundColor: cat.accentColor }} />
        <div className="farming-practices__card-body">
          <p className="farming-practices__card-title">{practice.name}</p>
          <p className="farming-practices__card-description">{practice.description}</p>
          <div className="farming-practices__chips">
            {practice.appliesTo.map((crop) => (
              <span
                key={crop}
                className="farming-practices__chip"
                style={{ backgroundColor: cat.badgeBg, color: cat.badgeText }}
              >
                {crop}
              </span>
            ))}
          </div>
          <div className="farming-practices__card-footer">
            <span className="farming-practices__difficulty" style={{ backgroundColor: diff.bg, color: diff.text }}>
              {practice.difficulty}
            </span>
            <span className="farming-practices__cost">{costSymbol(practice.cost)}</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default function FarmingPractices() {
  const bannerRefs = useRef([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          }
        }),
      { threshold: 0.1 }
    )

    bannerRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <Layout showSidebar>
      <div className="farming-practices">
        <section className="farming-practices__hero">
          <div className="farming-practices__eyebrow">Smart Tools</div>
          <h1>Farming Practices</h1>
          <p>Traditional wisdom. Modern technology. Natural methods.</p>

          <div className="farming-practices__toolbar">
            <div className="farming-practices__section-tabs">
              {Object.values(PRACTICES).map((cat) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => scrollToSection(cat.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                  className="farming-practices__section-tab"
                >
                  <span className="farming-practices__section-number">{cat.number}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <main className="farming-practices__content">
          {Object.entries(PRACTICES).map(([key, cat], index) => (
            <section key={key} id={cat.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}>
              <div
                ref={(el) => {
                  bannerRefs.current[index] = el
                }}
                className="farming-practices__banner"
                style={{ backgroundColor: cat.bannerBg }}
              >
                <div className="farming-practices__banner-number">{cat.number}</div>
                <div className="farming-practices__banner-copy">
                  <div className="farming-practices__banner-heading">
                    <span className="farming-practices__banner-number-small">{cat.number}</span>
                    <h2>{cat.label}</h2>
                  </div>
                  <p>
                    {key === 'traditional'
                      ? 'Time-tested methods passed down through generations of Indian farmers.'
                      : key === 'technology'
                        ? 'Modern tools, sensors, and techniques bringing precision to the farm.'
                        : 'No chemicals. Nature-based solutions that protect soil and health.'}
                  </p>
                </div>
              </div>

              <div className="farming-practices__grid">
                {cat.items.map((practice) => (
                  <PracticeCard key={practice.name} practice={practice} cat={cat} />
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </Layout>
  )
}
