import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface AlertModalProps {
  show: boolean;
  onHide: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ 
  show, 
  onHide, 
  title, 
  message, 
  confirmText,
  onConfirm 
}) => {
  const { t } = useLanguage();
  
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onHide();
  };

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
            {title && (
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{title}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={onHide}
                  aria-label={t('close')}
                ></button>
              </div>
            )}
            <div className="modal-body">
              <p className="mb-0">{message}</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-bee" 
                onClick={handleConfirm}
              >
                {confirmText || t('close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AlertModal;

