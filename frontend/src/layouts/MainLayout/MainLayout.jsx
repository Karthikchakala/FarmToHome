import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar.jsx';
import './MainLayout.css';

// Routes that use the full-width layout (no sidebar)
const FULL_WIDTH_ROUTES = ['/', '/login', '/register'];

const MainLayout = ({ children }) => {
    const location = useLocation();
    const isFullWidth = FULL_WIDTH_ROUTES.includes(location.pathname) ||
        location.pathname.startsWith('/products');

    if (isFullWidth) {
        // Home, auth, and product pages render full-width without sidebar
        return <div className="main-layout-fullwidth">{children}</div>;
    }

    return (
        <div className="main-layout">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
