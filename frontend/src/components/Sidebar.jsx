import React from 'react';

export default function Sidebar({ activePage, setActivePage, username, handleLogout }) {
  return (
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">SR</div><div><strong>StudentRiskAI</strong><small>ACADEMIC INTELLIGENCE</small></div></div>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="side-nav">
          <button className={activePage === 'overview' ? 'active' : ''} onClick={() => setActivePage('overview')}>▦ <span>Overview</span></button>
          <button className={activePage === 'students' ? 'active' : ''} onClick={() => setActivePage('students')}>♙ <span>Students</span></button>
          <button className={activePage === 'risk' ? 'active' : ''} onClick={() => setActivePage('risk')}>◎ <span>AI Risk Analysis</span></button>
          <button className={activePage === 'reports' ? 'active' : ''} onClick={() => setActivePage('reports')}>▤ <span>Reports</span></button>
        </nav>
        <div className="sidebar-bottom"><div className="admin-mini"><span className="admin-avatar">A</span><span><strong>{username || 'Administrator'}</strong><small>Administrator</small></span></div><button className="logout-button" onClick={handleLogout}>Log out</button></div>
      </aside>
  );
}
