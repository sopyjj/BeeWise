import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface LogoutModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
  userName?: string;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ show, onHide, onConfirm, userName }) => {
  const { t } = useLanguage();
  return (
    <>
      {show && <div className="modal-backdrop fade show"></div>}
      <div 
        className={`modal fade ${show ? 'show' : ''}`} 
        style={{ display: show ? 'block' : 'none' }}
        tabIndex={-1}
        aria-hidden={!show}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-2xl">
            <div className="modal-header">
              <h5 className="modal-title fw-bold">{t('logout')}</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onHide}
                aria-label={t('close')}
              ></button>
            </div>
            <div className="modal-body">
              <p className="mb-2">
                {userName 
                  ? t('logoutConfirmMessageWithUser').replace('{userName}', userName)
                  : t('logoutConfirmMessage')}
              </p>
              <p className="small text-muted mb-0">
                {t('logoutWarningMessage')}
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-ghost" 
                onClick={onHide}
              >
                {t('cancel')}
              </button>
              <button 
                className="btn-bee" 
                onClick={onConfirm}
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LogoutModal;