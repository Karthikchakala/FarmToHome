import FarmerNavbar from './FarmerNavbar'
import CustomerNavbar from './CustomerNavbar'
import AdminNavbar from './AdminNavbar'
import HomeNavbar from './HomeNavbar'
import DealerNavbar from './DealerNavbar'
import ExpertNavbar from './ExpertNavbar'
import { triggerSidebarToggle } from './Layout'

const PUBLIC_ROUTES = ['/', '/about', '/services', '/contact', '/products', '/product/:id']
const FARMER_LAYOUT_ROUTES = [
  '/ai-assistant',
  '/farmer/ai-assistant',
  '/farmer/pest-scanner',
  '/farmer/yield-predictor',
  '/farmer/crop-wiki',
  '/farmer/crop-simulator',
  '/farmer/climate-simulator',
  '/farmer/crop-monetizer',
  '/farmer/field-management',
  '/farmer/talk-to-experts'
]

const matchesPublicRoute = (pathname) =>
  PUBLIC_ROUTES.some((route) => {
    if (route.includes(':')) {
      return pathname.startsWith(route.split(':')[0])
    }

    return pathname === route
  })

const Navbar = ({ location, user, toggleSidebar }) => {
  if (matchesPublicRoute(location.pathname)) {
    return <HomeNavbar />
  }

  if (user?.role === 'farmer') {
    const showSidebarToggle = FARMER_LAYOUT_ROUTES.some((route) => location.pathname.startsWith(route))
    return <FarmerNavbar toggleSidebar={triggerSidebarToggle} showSidebarToggle={showSidebarToggle} />
  }

  if (user?.role === 'admin') {
    return <AdminNavbar />
  }

  if (user?.role === 'dealer') {
    return <DealerNavbar toggleSidebar={toggleSidebar} showSidebarToggle />
  }

  if (user?.role === 'expert') {
    return <ExpertNavbar toggleSidebar={toggleSidebar} showSidebarToggle />
  }

  if (user?.role === 'consumer') {
    return <CustomerNavbar toggleSidebar={toggleSidebar} showSidebarToggle />
  }

  return <HomeNavbar />
}

export default Navbar
