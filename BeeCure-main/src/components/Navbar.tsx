import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LogoutModal from './LogoutModal';

const Navbar: React.FC = () => {
  const { user, userProfile, logout } = useAuthContext();
  const { language, setLanguage, t } = useLanguage();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  return (
    <nav className="navbar navbar-expand-lg fixed-top shadow-sm">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <div className="nav-logo">
            <img src="/logo_nobg.png" alt="BeCure Logo" />
          </div>
          <span className="brand-name">BeCure</span>
        </Link>

        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#nav" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="nav">
          <ul className="navbar-nav ms-auto align-items-lg-center">
            <li className="nav-item">
              <Link className="nav-link" to="/">{t('inspect')}</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/map">{t('map')}</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/statistics">{t('statistics')}</Link>
            </li>
          </ul>
          
          {/* Auth buttons */}
          <div className="d-flex ms-lg-3 align-items-center gap-2">
            {user ? (
              <>
                <span className="text-white me-2 d-flex align-items-center" style={{ fontSize: '0.9rem' }}>
                  {userProfile?.displayName || user.email}
                </span>
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={handleLogoutClick}
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <Link className="btn btn-ghost btn-sm" to="/login">{t('login')}</Link>
            )}
            
            {/* Language Toggle - 로그아웃 버튼 우측으로 이동 */}
            <div className="lang-toggle">
              <button 
                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <button 
                className={`lang-btn ${language === 'ko' ? 'active' : ''}`}
                onClick={() => setLanguage('ko')}
              >
                KR
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <LogoutModal 
        show={showLogoutModal}
        onHide={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        userName={userProfile?.displayName || user?.email}
      />
    </nav>
  );
};

export default Navbar;
