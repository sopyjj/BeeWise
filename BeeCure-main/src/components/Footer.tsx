import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="text-center py-3">
      <small>&copy; 2025 BeCure · {t('fightMitesSaveBees')}</small>
    </footer>
  );
};

export default Footer;
