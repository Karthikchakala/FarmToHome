import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import './cropWiki.css'

const BADGE_CLASS = {
  vegetable: 'crop-wiki-detail__badge--vegetable',
  fruit: 'crop-wiki-detail__badge--fruit',
  'field crop': 'crop-wiki-detail__badge--field',
  'herbs & spices': 'crop-wiki-detail__badge--herbs',
}

export default function CropWikiDetail() {
  const { slug } = useParams()
  const [crop, setCrop] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const response = await fetch('/crops.json')
        if (!response.ok) throw new Error('Failed to load crop data')
        const data = await response.json()
        if (mounted) setCrop(data.find((item) => item.slug === slug) || null)
      } catch {
        if (mounted) setCrop(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [slug])

  const totalCost = useMemo(() => {
    if (!crop?.expenses?.length) return 0
    return crop.expenses.reduce((sum, expense) => sum + Number(expense.cost_inr || 0), 0)
  }, [crop])

  if (loading) {
    return (
      <Layout showSidebar>
        <div className="crop-wiki-detail__state">
          <div className="crop-wiki-detail__spinner" />
        </div>
      </Layout>
    )
  }

  if (!crop) {
    return (
      <Layout showSidebar>
        <div className="crop-wiki-detail__state crop-wiki-detail__state--empty">
          <h1>Crop not found</h1>
          <p>The crop you requested is not available in the wiki.</p>
          <Link to="/farmer/crop-wiki" className="crop-wiki-detail__back-btn">
            Back to Crop Wiki
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout showSidebar>
      <div className="crop-wiki-detail">
        <section className="crop-wiki-detail__hero">
          <Link to="/farmer/crop-wiki" className="crop-wiki-detail__back-link">
            Back to Wiki
          </Link>
          <div className={`crop-wiki-detail__badge ${BADGE_CLASS[crop.category.toLowerCase()] || ''}`}>
            {crop.category}
          </div>
          <h1>{crop.name}</h1>
          <p>{crop.summary}</p>
        </section>

        <div className="crop-wiki-detail__grid">
          <main className="crop-wiki-detail__main">
            <section className="crop-wiki-detail__stats-grid">
              {[
                { label: 'Soil', value: crop.conditions?.soil || '--' },
                { label: 'Water', value: crop.conditions?.water || '--' },
                { label: 'Climate', value: crop.conditions?.climate || '--' },
                { label: 'Season', value: crop.conditions?.season || '--' },
              ].map((item) => (
                <article key={item.label} className="crop-wiki-detail__stat">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </article>
              ))}
            </section>

            <section className="crop-wiki-detail__panel">
              <div className="crop-wiki-detail__panel-title">
                <h2>Estimated Expenses per Acre</h2>
              </div>
              <div className="crop-wiki-detail__table-wrap">
                <table className="crop-wiki-detail__table">
                  <thead>
                    <tr>
                      <th>Investment Item</th>
                      <th>Cost (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crop.expenses?.map((expense, index) => (
                      <tr key={`${expense.item}-${index}`}>
                        <td>{expense.item}</td>
                        <td>Rs. {Number(expense.cost_inr || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total Estimated Cost</td>
                      <td>Rs. {totalCost.toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            <section className="crop-wiki-detail__panel">
              <div className="crop-wiki-detail__panel-title">
                <h2>Cultivation Process</h2>
              </div>
              <div className="crop-wiki-detail__steps">
                {crop.process?.map((step, index) => (
                  <div key={`${step}-${index}`} className="crop-wiki-detail__step">
                    <span>{index + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </section>
          </main>

          <aside className="crop-wiki-detail__aside">
            <section className="crop-wiki-detail__timeline">
              <div className="crop-wiki-detail__timeline-card crop-wiki-detail__timeline-card--green">
                <span>Germination</span>
                <strong>{crop.time?.germination_days ?? '--'}</strong>
                <small>days</small>
              </div>
              <div className="crop-wiki-detail__timeline-card crop-wiki-detail__timeline-card--amber">
                <span>Harvest</span>
                <strong>{crop.time?.harvest_days ?? '--'}</strong>
                <small>days</small>
              </div>
            </section>

            <section className="crop-wiki-detail__panel">
              <div className="crop-wiki-detail__panel-title">
                <h2>Labour Needs</h2>
              </div>
              <div className="crop-wiki-detail__labour">
                <div>
                  <span>Intensity</span>
                  <strong>{crop.labour?.intensity || '--'}</strong>
                </div>
                <div>
                  <span>Workers / Acre</span>
                  <strong>{crop.labour?.workers_per_acre ?? '--'}</strong>
                </div>
                <p>{crop.labour?.notes || 'No labour notes available.'}</p>
              </div>
            </section>

            <section className="crop-wiki-detail__panel">
              <div className="crop-wiki-detail__panel-title">
                <h2>Required Resources</h2>
              </div>
              <ul className="crop-wiki-detail__resources">
                <li>
                  <span>Seeds</span>
                  <strong>{crop.resources?.seeds || '--'}</strong>
                </li>
                <li>
                  <span>Fertilizer</span>
                  <strong>{crop.resources?.fertilizer || '--'}</strong>
                </li>
                <li>
                  <span>Pesticides</span>
                  <strong>{crop.resources?.pesticides || '--'}</strong>
                </li>
              </ul>
            </section>

            <section className="crop-wiki-detail__panel">
              <div className="crop-wiki-detail__panel-title">
                <h2>Critical Watchouts</h2>
              </div>
              <div className="crop-wiki-detail__watchout-list">
                {crop.watchouts?.map((item, index) => (
                  <div key={`${item}-${index}`} className="crop-wiki-detail__watchout">
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </Layout>
  )
}
