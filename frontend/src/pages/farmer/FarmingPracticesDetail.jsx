import { Link, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import { ALL_PRACTICES, PRACTICE_DETAILS, costSymbol, diffStyle, toSlug } from './farmingPracticesData'
import './farmingPractices.css'

const CAT = {
  traditional: { color: '#718355', bg: '#e9f5db', label: 'Traditional' },
  technology: { color: '#245501', bg: '#cfe1b9', label: 'New Technology' },
  organic: { color: '#538d22', bg: '#dde5b6', label: 'Organic & Natural' },
}

export default function FarmingPracticesDetail() {
  const { slug } = useParams()

  if (!slug) return null

  const practice = ALL_PRACTICES.find((item) => toSlug(item.name) === slug)

  if (!practice) {
    return (
      <Layout showSidebar>
        <div className="farming-practices-detail__state">
          <h1>Practice not found</h1>
          <p>The practice you requested is not available in this guide.</p>
          <Link to="/farmer/farming-practices" className="farming-practices-detail__back-btn">
            Back to Farming Practices
          </Link>
        </div>
      </Layout>
    )
  }

  const detail = PRACTICE_DETAILS[slug]
  const cat = CAT[practice.category] || CAT.traditional
  const diff = diffStyle(practice.difficulty)
  const related = detail
    ? ALL_PRACTICES.filter((item) => detail.related.includes(item.name))
    : ALL_PRACTICES.filter((item) => item.category === practice.category && item.name !== practice.name).slice(0, 3)

  return (
    <Layout showSidebar>
      <div className="farming-practices-detail">
        <section className="farming-practices-detail__hero">
          <Link to="/farmer/farming-practices" className="farming-practices-detail__back-link">
            Back to Practices
          </Link>
          <div className="farming-practices-detail__badge" style={{ backgroundColor: cat.bg, color: cat.color }}>
            {cat.label}
          </div>
          <div className="farming-practices-detail__meta-row">
            <span className="farming-practices-detail__difficulty" style={{ backgroundColor: diff.bg, color: diff.text }}>
              {practice.difficulty}
            </span>
            <span className="farming-practices-detail__cost">{costSymbol(practice.cost)}</span>
          </div>
          <h1>{practice.name}</h1>
          <p>{practice.description}</p>
        </section>

        <div className="farming-practices-detail__grid">
          <main className="farming-practices-detail__main">
            <section className="farming-practices-detail__panel">
              <div className="farming-practices-detail__panel-title">
                <h2>What it is</h2>
              </div>
              <div className="farming-practices-detail__body">{detail?.what || 'Detailed guide coming soon.'}</div>
            </section>

            {detail && (
              <>
                <section className="farming-practices-detail__panel">
                  <div className="farming-practices-detail__panel-title">
                    <h2>Why it helps</h2>
                  </div>
                  <div className="farming-practices-detail__list">
                    {detail.why.map((point, index) => (
                      <div key={`${point}-${index}`} className="farming-practices-detail__list-item">
                        <span className="farming-practices-detail__bullet" style={{ backgroundColor: cat.color }}>
                          +
                        </span>
                        <p>{point}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="farming-practices-detail__panel">
                  <div className="farming-practices-detail__panel-title">
                    <h2>How to do it</h2>
                  </div>
                  <div className="farming-practices-detail__steps">
                    {detail.steps.map((step, index) => (
                      <div key={`${step}-${index}`} className="farming-practices-detail__step">
                        <span style={{ backgroundColor: cat.color }}>{index + 1}</span>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="farming-practices-detail__panel">
                  <div className="farming-practices-detail__panel-title">
                    <h2>Estimated Cost Breakdown</h2>
                  </div>
                  <div className="farming-practices-detail__table-wrap">
                    <table className="farming-practices-detail__table">
                      <thead>
                        <tr style={{ backgroundColor: cat.bg }}>
                          <th style={{ color: cat.color }}>Item</th>
                          <th style={{ color: cat.color }}>Estimated Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.costs.map((row, index) => (
                          <tr key={`${row.item}-${index}`}>
                            <td>{row.item}</td>
                            <td>{row.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {!detail && (
              <section className="farming-practices-detail__panel">
                <div className="farming-practices-detail__empty">
                  <p>Detailed guide coming soon.</p>
                </div>
              </section>
            )}
          </main>

          <aside className="farming-practices-detail__aside">
            <section className="farming-practices-detail__panel">
              <div className="farming-practices-detail__panel-title">
                <h2>Works best with</h2>
              </div>
              <div className="farming-practices-detail__chips">
                {practice.appliesTo.map((crop) => (
                  <span key={crop} className="farming-practices-detail__chip" style={{ backgroundColor: cat.bg, color: cat.color }}>
                    {crop}
                  </span>
                ))}
              </div>
            </section>

            <section className="farming-practices-detail__panel">
              <div className="farming-practices-detail__panel-title">
                <h2>Related Practices</h2>
              </div>
              <div className="farming-practices-detail__related">
                {related.map((item) => {
                  const pc = CAT[item.category] || CAT.traditional
                  const pd = diffStyle(item.difficulty)

                  return (
                    <Link key={item.name} to={`/farmer/farming-practices/${toSlug(item.name)}`} className="farming-practices-detail__related-card">
                      <div className="farming-practices-detail__related-strip" style={{ backgroundColor: pc.color }} />
                      <div className="farming-practices-detail__related-body">
                        <strong>{item.name}</strong>
                        <p>{item.description}</p>
                        <div className="farming-practices-detail__related-meta">
                          <span style={{ backgroundColor: pd.bg, color: pd.text }}>{item.difficulty}</span>
                          <span>{costSymbol(item.cost)}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </Layout>
  )
}
