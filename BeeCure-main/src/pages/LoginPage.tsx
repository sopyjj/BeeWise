import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuthContext } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuthContext();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    if (!form.checkValidity()) {
      e.stopPropagation();
      setIsValidated(true);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    const result = await login(email, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || '로그인에 실패했습니다.');
    }
    
    setIsLoading(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <Navbar />
      <main className="auth-hero">
        <div className="bg-ornament"></div>
        <div className="container position-relative" data-aos="zoom-in" data-aos-delay="120">
          <div className="row justify-content-center">
            <div className="col-12 col-md-10 col-lg-7 col-xl-5">
              <div className="auth-card p-4 p-md-5">
                <div className="text-center mb-3">
                  <img 
                    src="/logo_nobg.png" 
                    alt="BeCure" 
                    style={{ height: '180px' }} 
                    className="mb-2"
                  />
                  <h1 className="h3 fw-bold mb-1">{t('welcomeBack')}</h1>
                  <p className="text-muted mb-0">{t('loginSubtitle')}</p>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                
                <form 
                  onSubmit={handleSubmit}
                  className={`needs-validation ${isValidated ? 'was-validated' : ''}`}
                  noValidate
                >
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">{t('email')}</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      id="email" 
                      name="email" 
                      placeholder={t('emailPlaceholder')} 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                    <div className="invalid-feedback">{t('validEmail')}</div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <label htmlFor="password" className="form-label fw-semibold mb-0">{t('password')}</label>
                      <button 
                        className="btn btn-sm btn-link link-bee p-0" 
                        type="button" 
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? t('hide') : t('show')}
                      </button>
                    </div>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className="form-control" 
                      id="password" 
                      name="password" 
                      placeholder={t('passwordPlaceholder')} 
                      minLength={6} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                    <div className="invalid-feedback">{t('passwordRequired')}</div>
                  </div>

                  <button 
                    className="btn-bee w-100" 
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {t('loggingIn')}
                      </>
                    ) : (
                      t('logIn')
                    )}
                  </button>
                  <p className="text-center mt-3 mb-0">
                    {t('noAccount')} <Link className="link-bee" to="/register">{t('createOne')}</Link>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default LoginPage;
