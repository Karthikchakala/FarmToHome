import { Link } from 'react-router-dom'
import './CategorySection.css'

const CategorySection = () => {
  const categories = [
    {
      id: 'vegetables',
      name: 'Vegetables',
      icon: '🥬',
      description: 'Fresh, organic vegetables straight from the farm',
      color: '#28a745'
    },
    {
      id: 'fruits',
      name: 'Fruits',
      icon: '🍎',
      description: 'Sweet and juicy seasonal fruits',
      color: '#dc3545'
    },
    {
      id: 'dairy',
      name: 'Dairy',
      icon: '🥛',
      description: 'Fresh milk, cheese, and dairy products',
      color: '#007bff'
    },
    {
      id: 'grains',
      name: 'Grains',
      icon: '🌾',
      description: 'Organic grains and cereals',
      color: '#ffc107'
    },
    {
      id: 'herbs',
      name: 'Herbs',
      icon: '🌿',
      description: 'Aromatic herbs and spices',
      color: '#6f42c1'
    },
    {
      id: 'flowers',
      name: 'Flowers',
      icon: '🌻',
      description: 'Fresh flowers and ornamental plants',
      color: '#fd7e14'
    }
  ]

  return (
    <section className="category-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Shop by Category</h2>
          <p className="section-subtitle">Browse our wide selection of fresh, organic products</p>
        </div>
        
        <div className="categories-grid">
          {categories.map((category) => (
            <Link 
              key={category.id} 
              to={`/products?category=${category.id}`}
              className="category-card"
            >
              <div 
                className="category-icon-wrapper"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <span className="category-icon" style={{ color: category.color }}>
                  {category.icon}
                </span>
              </div>
              
              <div className="category-content">
                <h3 className="category-name">{category.name}</h3>
                <p className="category-description">{category.description}</p>
                <div className="category-action">
                  <span className="shop-text">Shop Now</span>
                  <span className="arrow">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="section-footer">
          <Link to="/products" className="btn btn-outline btn-large">
            🛍️ View All Products
          </Link>
        </div>
      </div>
    </section>
  )
}

export default CategorySection
