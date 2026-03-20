import './Pagination.css'

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  hasNext, 
  hasPrev,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5
}) => {
  const getVisiblePages = () => {
    const pages = []
    const halfVisible = Math.floor(maxVisiblePages / 2)
    
    let start = Math.max(1, currentPage - halfVisible)
    let end = Math.min(totalPages, start + maxVisiblePages - 1)
    
    // Adjust start if we're near the end
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1)
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    return pages
  }

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page)
    }
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="pagination">
      {showFirstLast && (
        <button
          className="pagination-btn pagination-first"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          aria-label="First page"
        >
          «
        </button>
      )}

      {showPrevNext && (
        <button
          className="pagination-btn pagination-prev"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!hasPrev}
          aria-label="Previous page"
        >
          ‹
        </button>
      )}

      <div className="pagination-pages">
        {getVisiblePages().map(page => (
          <button
            key={page}
            className={`pagination-page ${page === currentPage ? 'active' : ''}`}
            onClick={() => handlePageChange(page)}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
      </div>

      {showPrevNext && (
        <button
          className="pagination-btn pagination-next"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!hasNext}
          aria-label="Next page"
        >
          ›
        </button>
      )}

      {showFirstLast && (
        <button
          className="pagination-btn pagination-last"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
        >
          »
        </button>
      )}

      <div className="pagination-info">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  )
}

export default Pagination
