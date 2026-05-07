import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuthContext } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuthContext();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^\w]/.test(password)) strength++;
    return Math.min(strength, 5);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    
    // Check password match
    const passwordMatch = formData.password === formData.confirmPassword;
    const confirmInput = form.querySelector('#confirm') as HTMLInputElement;
    if (confirmInput) {
      confirmInput.setCustomValidity(passwordMatch ? '' : t('passwordsDoNotMatch'));
    }
    
    if (!form.checkValidity()) {
      e.stopPropagation();
      setIsValidated(true);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    const result = await register(
      formData.email, 
      formData.password, 
      formData.name, 
      formData.email.split('@')[0] // username을 email의 @ 앞 부분으로 설정
    );
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || '회원가입에 실패했습니다.');
    }
    
    setIsLoading(false);
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength >= 4) return t('strongPassword');
    if (passwordStrength === 3) return t('goodPassword');
    return t('addNumbersSymbols');
  };

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
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
                  <h1 className="h3 fw-bold mb-1">{t('createAccount')}</h1>
                  <p className="text-muted mb-0">{t('joinSubtitle')}</p>
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
                    <label htmlFor="name" className="form-label fw-semibold">{t('fullName')}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="name" 
                      name="name" 
                      placeholder={t('namePlaceholder')} 
                      value={formData.name}
                      onChange={handleInputChange}
                      required 
                    />
                    <div className="invalid-feedback">{t('enterName')}</div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">{t('email')}</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      id="email" 
                      name="email" 
                      placeholder={t('emailPlaceholder')} 
                      value={formData.email}
                      onChange={handleInputChange}
                      required 
                    />
                    <div className="invalid-feedback">{t('validEmail')}</div>
                  </div>

                  <div className="mb-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <label htmlFor="password" className="form-label fw-semibold mb-0">{t('password')}</label>
                      <button 
                        className="btn btn-sm btn-link link-bee p-0" 
                        type="button" 
                        onClick={() => togglePasswordVisibility('password')}
                      >
                        {showPassword ? t('hide') : t('show')}
                      </button>
                    </div>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className="form-control" 
                      id="password" 
                      name="password" 
                      minLength={8} 
                      placeholder={t('atLeast8Chars')} 
                      value={formData.password}
                      onChange={handleInputChange}
                      required 
                    />
                    <div className="invalid-feedback">{t('passwordMustBe8')}</div>
                  </div>
                  
                  {/* Password strength meter */}
                  <div className="meter mb-2" aria-hidden="true">
                    <span 
                      id="pwdMeter" 
                      style={{ width: `${passwordStrength * 20}%` }}
                    ></span>
                  </div>
                  <div className="form-text small mb-3" id="pwdTip">
                    {getPasswordStrengthText()}
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <label htmlFor="confirm" className="form-label fw-semibold mb-0">{t('confirmPassword')}</label>
                      <button 
                        className="btn btn-sm btn-link link-bee p-0" 
                        type="button" 
                        onClick={() => togglePasswordVisibility('confirmPassword')}
                      >
                        {showConfirmPassword ? t('hide') : t('show')}
                      </button>
                    </div>
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      className="form-control" 
                      id="confirm" 
                      name="confirmPassword" 
                      placeholder={t('reTypePassword')} 
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required 
                    />
                    <div className="invalid-feedback" id="confirmFeedback">
                      {formData.confirmPassword && formData.password !== formData.confirmPassword 
                        ? t('passwordsMustMatch') 
                        : t('pleaseConfirmPassword')}
                    </div>
                  </div>

                  <button 
                    className="btn-bee w-100" 
                    type="submit" 
                    disabled={isLoading || !formData.password || formData.password !== formData.confirmPassword}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {t('creatingAccount')}
                      </>
                    ) : (
                      t('createAccountBtn')
                    )}
                  </button>
                  <p className="text-center mt-3 mb-0">
                    {t('alreadyHaveAccount')} <Link className="link-bee" to="/login">{t('logIn')}</Link>
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

export default RegisterPage;
