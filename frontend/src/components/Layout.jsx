import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import './Layout.css'; 

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleLinkClick = () => {
        if (window.innerWidth <= 768) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="layout-wrapper">
            <div 
                className={`mobile-overlay ${isSidebarOpen ? 'show' : ''}`} 
                onClick={toggleSidebar}
            ></div>

            <nav className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <h2>Clínica La Luz</h2>
                    <button className="close-btn" onClick={toggleSidebar}>&times;</button>
                </div>
                <ul className="sidebar-menu">
                    <li><Link to="/dashboard" onClick={handleLinkClick}>Cirugías</Link></li>
                    <li><Link to="/horarios" onClick={handleLinkClick}>Horarios Médicos</Link></li>
                    <li><Link to="/atenciones" onClick={handleLinkClick}>Atenciones Médicas</Link></li>
                </ul>
            </nav>

            <main className={`main-content ${isSidebarOpen ? '' : 'expanded'}`}>
                <header className="top-navbar">
                    <button className="menu-toggle-btn" onClick={toggleSidebar}>
                        &#9776;
                    </button>
                </header>
                
                <div className="content-padding">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;