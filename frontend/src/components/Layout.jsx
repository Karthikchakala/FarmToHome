import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import './Layout.css'

const SIDEBAR_TOGGLE_EVENT = 'farmtohome:toggle-sidebar'

const Layout = ({ showSidebar = false, contentClassName = '', children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    if (!showSidebar) {
      return undefined
    }

    const handleToggleSidebar = () => {
      setIsSidebarOpen((current) => !current)
    }

    const handleCloseSidebar = () => {
      setIsSidebarOpen(false)
    }

    window.addEventListener(SIDEBAR_TOGGLE_EVENT, handleToggleSidebar)
    window.addEventListener('resize', handleCloseSidebar)

    return () => {
      window.removeEventListener(SIDEBAR_TOGGLE_EVENT, handleToggleSidebar)
      window.removeEventListener('resize', handleCloseSidebar)
    }
  }, [showSidebar])

  const handleToggleSidebar = () => {
    setIsSidebarOpen((current) => !current)
  }

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false)
  }

  return (
    <div className={`app-layout ${showSidebar ? 'app-layout--with-sidebar' : ''}`}>
      {showSidebar && (
        <aside className="app-layout__sidebar">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={handleToggleSidebar} />
        </aside>
      )}

      <section className={`app-layout__main ${contentClassName}`.trim()} onClick={handleCloseSidebar}>
        <div className="app-layout__content">{children}</div>
      </section>
    </div>
  )
}

export const triggerSidebarToggle = () => {
  window.dispatchEvent(new Event(SIDEBAR_TOGGLE_EVENT))
}

export default Layout
