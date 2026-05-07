import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../contexts/LanguageContext';

interface ResultData {
  infected: boolean;
  confidence: number;
  count: number;
}

const AfterDetectPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Get result data from navigation state
  const result = location.state?.result as ResultData;
  const imageUrl = location.state?.imageUrl as string;

  // Default values if no data is passed
  const defaultResult: ResultData = {
    infected: true,
    confidence: 0.84,
    count: 3
  };

  const finalResult = result || defaultResult;

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="py-5">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-12 col-lg-8">
                <div className="card-soft p-4 p-md-5 text-center">
                  <h1 className="h3 fw-bold mb-4">{t('analysisResult')}</h1>

                  {/* Image */}
                  <div className="img-shell mb-4">
                    <img 
                      src={imageUrl || "/sample.jpeg"} 
                      alt="Analyzed Bee" 
                    />
                  </div>

                  {/* Result Info */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-center align-items-center flex-wrap gap-3 mb-3">
                      <div className={`chip ${finalResult.infected ? 'bad' : 'ok'}`}>
                        {finalResult.infected ? t('likelyInfectedResult') : t('unlikelyInfectedResult')}
                      </div>
                      <div className="accuracy-chip">
                        {t('accuracy')} <strong>{(finalResult.confidence * 100).toFixed(1)}%</strong>
                      </div>
                    </div>
                    <p className="text-muted mb-0 small">
                      {finalResult.infected 
                        ? t('infectedResult')
                        : t('uninfectedResult')
                      }
                    </p>
                  </div>

                  {/* Back button */}
                  <button 
                    className="btn-bee mt-3"
                    onClick={() => navigate('/')}
                  >
                    {t('backToSubmit')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default AfterDetectPage;
