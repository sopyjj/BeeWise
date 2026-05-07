import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuthContext } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { diagnosisService, Diagnosis, ApiaryStats } from '../services/diagnosisService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type MainTabType = 'my' | 'global';
type PeriodTabType = 'weekly' | 'monthly' | 'alltime';

const StatisticsPage: React.FC = () => {
  const [mainTab, setMainTab] = useState<MainTabType>('my');
  const [periodTab, setPeriodTab] = useState<PeriodTabType>('weekly');
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [apiaryStats, setApiaryStats] = useState<ApiaryStats[]>([]);
  const [selectedApiaryId, setSelectedApiaryId] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedApiaryDiagnoses, setSelectedApiaryDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);
  const { user } = useAuthContext();
  const { t } = useLanguage();

  // 내 통계 데이터 조회
  useEffect(() => {
    const fetchMyDiagnoses = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      if (mainTab !== 'my') {
        return;
      }

      try {
        console.log('📊 내 통계 데이터 조회 시작');
        const recentDiagnoses = await diagnosisService.getRecentDiagnoses(user.uid, 100);
        setDiagnoses(recentDiagnoses);
        console.log('📊 진단 데이터 로드 완료:', recentDiagnoses.length, '개');
      } catch (error) {
        console.error('❌ 통계 데이터 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyDiagnoses();
  }, [user, mainTab]);

  // 전체 통계 데이터 조회
  useEffect(() => {
    const fetchGlobalStats = async () => {
      if (mainTab !== 'global') {
        return;
      }

      setGlobalLoading(true);
      try {
        console.log('📊 전체 통계 데이터 조회 시작');
        const stats = await diagnosisService.getAllDiagnosesGroupedByApiary();
        setApiaryStats(stats);
        console.log('📊 양봉장별 통계 로드 완료:', stats.length, '개');
        
        // 첫 번째 양봉장 선택
        if (stats.length > 0 && !selectedApiaryId) {
          setSelectedApiaryId(stats[0].apiaryId);
        }
      } catch (error) {
        console.error('❌ 전체 통계 데이터 조회 오류:', error);
      } finally {
        setGlobalLoading(false);
      }
    };

    fetchGlobalStats();
  }, [mainTab, selectedApiaryId]);

  // 선택된 양봉장의 진단 데이터 조회
  useEffect(() => {
    const fetchSelectedApiaryDiagnoses = async () => {
      if (mainTab !== 'global' || !selectedApiaryId) {
        return;
      }

      setGlobalLoading(true);
      try {
        const diagnoses = await diagnosisService.getDiagnosesByApiaryId(selectedApiaryId);
        setSelectedApiaryDiagnoses(diagnoses);
      } catch (error) {
        console.error('❌ 양봉장 진단 데이터 조회 오류:', error);
      } finally {
        setGlobalLoading(false);
      }
    };

    fetchSelectedApiaryDiagnoses();
  }, [selectedApiaryId, mainTab]);

  // 내 통계용 데이터 처리
  const processData = (diagnoses: Diagnosis[], period: PeriodTabType) => {
    if (diagnoses.length === 0) {
      return {
        labels: [],
        detects: [],
        confidence: [],
        totals: { total: 0, inf: 0, uninf: 0, conf: 0, delta: 'No data' }
      };
    }

    const now = new Date();
    let filteredDiagnoses: Diagnosis[] = [];
    let labels: string[] = [];
    let detects: number[] = [];
    let confidence: number[] = [];

    if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredDiagnoses = diagnoses.filter(d => d.timestamp >= weekAgo);
      
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      detects = Array(7).fill(0);
      confidence = Array(7).fill(0);
      const confidenceCounts = Array(7).fill(0);

      filteredDiagnoses.forEach(diagnosis => {
        const dayOfWeek = diagnosis.timestamp.getDay();
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        detects[adjustedDay]++;
        confidence[adjustedDay] += diagnosis.accuracy;
        confidenceCounts[adjustedDay]++;
      });

      confidence = confidence.map((sum, i) => 
        confidenceCounts[i] > 0 ? Math.round((sum / confidenceCounts[i]) * 100) / 100 : 0
      );

    } else if (period === 'monthly') {
      const monthAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      filteredDiagnoses = diagnoses.filter(d => d.timestamp >= monthAgo);
      
      labels = ['W1', 'W2', 'W3', 'W4'];
      detects = Array(4).fill(0);
      confidence = Array(4).fill(0);
      const confidenceCounts = Array(4).fill(0);

      filteredDiagnoses.forEach(diagnosis => {
        const daysDiff = Math.floor((now.getTime() - diagnosis.timestamp.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const weekIndex = Math.min(3, Math.max(0, daysDiff));
        detects[weekIndex]++;
        confidence[weekIndex] += diagnosis.accuracy;
        confidenceCounts[weekIndex]++;
      });

      confidence = confidence.map((sum, i) => 
        confidenceCounts[i] > 0 ? Math.round((sum / confidenceCounts[i]) * 100) / 100 : 0
      );

    } else {
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      filteredDiagnoses = diagnoses.filter(d => d.timestamp >= sixMonthsAgo);
      
      labels = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
      detects = Array(6).fill(0);
      confidence = Array(6).fill(0);
      const confidenceCounts = Array(6).fill(0);

      filteredDiagnoses.forEach(diagnosis => {
        const month = diagnosis.timestamp.getMonth();
        const monthIndex = Math.min(5, Math.max(0, month - 4));
        detects[monthIndex]++;
        confidence[monthIndex] += diagnosis.accuracy;
        confidenceCounts[monthIndex]++;
      });

      confidence = confidence.map((sum, i) => 
        confidenceCounts[i] > 0 ? Math.round((sum / confidenceCounts[i]) * 100) / 100 : 0
      );
    }

    const total = filteredDiagnoses.length;
    const infected = filteredDiagnoses.filter(d => 
      d.infection === 'yes' || d.infection === 'mites detected'
    ).length;
    const uninfected = total - infected;
    const avgConfidence = total > 0 ? 
      Math.round((filteredDiagnoses.reduce((sum, d) => sum + d.accuracy, 0) / total) * 100) / 100 : 0;

    return {
      labels,
      detects,
      confidence,
      totals: { 
        total, 
        inf: infected, 
        uninf: uninfected, 
        conf: avgConfidence, 
        delta: period === 'weekly' ? 'vs last week' : 
               period === 'monthly' ? 'vs last month' : 'since start'
      }
    };
  };

  // Species and places 데이터 처리
  const processSpeciesAndPlacesData = (diagnoses: Diagnosis[], period: PeriodTabType) => {
    if (diagnoses.length === 0) {
      return {
        species: { labels: [], counts: [] },
        places: { labels: [], counts: [] }
      };
    }

    const now = new Date();
    let filteredDiagnoses: Diagnosis[] = [];

    if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredDiagnoses = diagnoses.filter(d => d.timestamp >= weekAgo);
    } else if (period === 'monthly') {
      const monthAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      filteredDiagnoses = diagnoses.filter(d => d.timestamp >= monthAgo);
    } else {
      filteredDiagnoses = diagnoses;
    }

    const speciesCount: { [key: string]: number } = {};
    const locationCount: { [key: string]: number } = {};

    filteredDiagnoses.forEach(diagnosis => {
      const species = diagnosis.species || 'Unknown';
      speciesCount[species] = (speciesCount[species] || 0) + 1;
      
      const locationText = diagnosis.location?.text || diagnosis.location?.region || 'Unknown';
      locationCount[locationText] = (locationCount[locationText] || 0) + 1;
    });

    const topSpecies = Object.entries(speciesCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    const speciesData = {
      labels: topSpecies.length > 0 ? topSpecies.map(([species]) => species) : ['No data'],
      counts: topSpecies.length > 0 ? topSpecies.map(([, count]) => count) : [0]
    };

    const topLocations = Object.entries(locationCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    const placesData = {
      labels: topLocations.length > 0 ? topLocations.map(([location]) => location) : ['No data'],
      counts: topLocations.length > 0 ? topLocations.map(([, count]) => count) : [0]
    };

    return { species: speciesData, places: placesData };
  };

  // Chart configurations
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        min: 0.5,
        max: 1,
        ticks: {
          callback: (value: any) => {
            const percentage = Math.round(value * 100);
            return percentage + '%';
          },
          stepSize: 0.05,
        },
      },
    },
  };

  const horizontalBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  };

  // 내 통계 탭 렌더링
  const renderMyStatistics = () => {
    const weeklyData = processData(diagnoses, 'weekly');
    const monthlyData = processData(diagnoses, 'monthly');
    const alltimeData = processData(diagnoses, 'alltime');

    const getCurrentData = () => {
      switch (periodTab) {
        case 'weekly': return weeklyData;
        case 'monthly': return monthlyData;
        case 'alltime': return alltimeData;
        default: return weeklyData;
      }
    };

    const weeklySpeciesPlaces = processSpeciesAndPlacesData(diagnoses, 'weekly');
    const monthlySpeciesPlaces = processSpeciesAndPlacesData(diagnoses, 'monthly');
    const alltimeSpeciesPlaces = processSpeciesAndPlacesData(diagnoses, 'alltime');

    const topSpeciesData = {
      weekly: weeklySpeciesPlaces.species,
      monthly: monthlySpeciesPlaces.species,
      alltime: alltimeSpeciesPlaces.species
    };

    const topPlacesData = {
      weekly: weeklySpeciesPlaces.places,
      monthly: monthlySpeciesPlaces.places,
      alltime: alltimeSpeciesPlaces.places
    };

    const currentData = getCurrentData();
    const currentSpeciesData = topSpeciesData[periodTab];
    const currentPlacesData = topPlacesData[periodTab];

    const barChartData = {
      labels: currentData.labels,
      datasets: [
        {
          data: currentData.detects,
          backgroundColor: 'rgba(243, 156, 18, 0.85)',
          borderColor: 'rgba(243, 156, 18, 1)',
          borderWidth: 1.5,
          borderRadius: 8,
        },
      ],
    };

    const lineChartData = {
      labels: currentData.labels,
      datasets: [
        {
          data: currentData.confidence,
          borderColor: 'rgba(243, 156, 18, 1)',
          backgroundColor: 'rgba(243, 156, 18, 0.35)',
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: '#fff',
          pointBorderColor: 'rgba(243, 156, 18, 1)',
          fill: true,
        },
      ],
    };

    const speciesChartData = {
      labels: currentSpeciesData.labels,
      datasets: [
        {
          data: currentSpeciesData.counts,
          backgroundColor: 'rgba(243, 156, 18, 0.85)',
          borderColor: 'rgba(243, 156, 18, 1)',
          borderWidth: 1.5,
          borderRadius: 8,
        },
      ],
    };

    const placesChartData = {
      labels: currentPlacesData.labels,
      datasets: [
        {
          data: currentPlacesData.counts,
          backgroundColor: 'rgba(243, 156, 18, 0.85)',
          borderColor: 'rgba(243, 156, 18, 1)',
          borderWidth: 1.5,
          borderRadius: 8,
        },
      ],
    };

    return (
      <>
        {/* 기간 탭 */}
        <ul className="nav nav-pills nav-bee mb-4" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${periodTab === 'weekly' ? 'active' : ''}`}
              onClick={() => setPeriodTab('weekly')}
              type="button"
            >
              {t('weekly')}
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${periodTab === 'monthly' ? 'active' : ''}`}
              onClick={() => setPeriodTab('monthly')}
              type="button"
            >
              {t('monthly')}
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${periodTab === 'alltime' ? 'active' : ''}`}
              onClick={() => setPeriodTab('alltime')}
              type="button"
            >
              {t('allTime')}
            </button>
          </li>
        </ul>

        {/* 통계 내용 */}
        {diagnoses.length === 0 ? (
          <div className="text-center py-5">
            <div className="mb-3">
              <i className="fas fa-chart-bar text-muted" style={{ fontSize: '3rem' }}></i>
            </div>
            <h5 className="text-muted mb-3">{t('noStatistics')}</h5>
            <p className="text-muted mb-4">
              {t('startAnalyzing')}
            </p>
            <a href="/" className="btn btn-bee">{t('startAnalyzingBtn')}</a>
          </div>
        ) : (
          <div className="row g-3 g-md-4">
            {/* KPI Cards */}
            <div className="col-12 col-md-3">
              <div className="kpi-card">
                <div className="kpi-title">{t('totalDetects')}</div>
                <div className="kpi-value">{currentData.totals.total}</div>
                <div className="kpi-sub">{currentData.totals.delta === 'vs last week' ? t('vsLastWeek') : 
                                         currentData.totals.delta === 'vs last month' ? t('vsLastMonth') : 
                                         t('sinceStart')}</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="kpi-card">
                <div className="kpi-title">{t('infected')}</div>
                <div className="kpi-value">{currentData.totals.inf}</div>
                <div className="kpi-sub">{t('flaggedPositive')}</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="kpi-card">
                <div className="kpi-title">{t('uninfected')}</div>
                <div className="kpi-value">{currentData.totals.uninf}</div>
                <div className="kpi-sub">{t('clearResults')}</div>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="kpi-card">
                <div className="kpi-title">{t('avgConfidence')}</div>
                <div className="kpi-value">{(currentData.totals.conf * 100).toFixed(0)}%</div>
                <div className="kpi-sub">{t('acrossAllDetects')}</div>
              </div>
            </div>

            {/* Charts */}
            <div className="col-12 col-xl-7">
              <div className="chart-wrap">
                <div className="fw-semibold mb-2">
                  {periodTab === 'weekly' ? t('detectionsPerDay') : 
                   periodTab === 'monthly' ? t('detectionsPerWeek') : 
                   t('detectionsPerMonth')}
                </div>
                <div style={{ height: '300px' }}>
                  <Bar data={barChartData} options={barOptions} />
                </div>
              </div>
            </div>
            <div className="col-12 col-xl-5">
              <div className="chart-wrap">
                <div className="fw-semibold mb-2">
                  {t('confidenceTrend')}
                </div>
                <div style={{ height: '300px' }}>
                  <Line data={lineChartData} options={lineOptions} />
                </div>
              </div>
            </div>

            {/* Top 5 Charts */}
            <div className="col-12 col-xl-6">
              <div className="chart-wrap">
                <div className="fw-semibold mb-2">
                  {t('top5Species')} ({periodTab === 'weekly' ? t('weekly') : periodTab === 'monthly' ? t('monthly') : t('allTime')})
                </div>
                <div style={{ height: '300px' }}>
                  <Bar data={speciesChartData} options={horizontalBarOptions} />
                </div>
              </div>
            </div>
            <div className="col-12 col-xl-6">
              <div className="chart-wrap">
                <div className="fw-semibold mb-2">
                  {t('top5Locations')} ({periodTab === 'weekly' ? t('weekly') : periodTab === 'monthly' ? t('monthly') : t('allTime')})
                </div>
                <div style={{ height: '300px' }}>
                  <Bar data={placesChartData} options={horizontalBarOptions} />
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // 전체 통계 탭 렌더링
  const renderGlobalStatistics = () => {
    const selectedApiary = apiaryStats.find(stat => stat.apiaryId === selectedApiaryId);

    if (globalLoading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">{t('loadingStatistics')}</p>
        </div>
      );
    }

    if (apiaryStats.length === 0) {
      return (
        <div className="text-center py-5">
          <div className="mb-3">
            <i className="fas fa-chart-bar text-muted" style={{ fontSize: '3rem' }}></i>
          </div>
          <h5 className="text-muted mb-3">{t('noApiaryStatistics')}</h5>
          <p className="text-muted mb-4">
            {t('noApiaryData')}
          </p>
        </div>
      );
    }

    return (
      <>
        {/* 양봉장 선택 드롭다운 */}
        <div className="mb-4">
          <label htmlFor="apiary-select" className="form-label fw-semibold">{t('selectApiary')}</label>
          <select
            id="apiary-select"
            className="form-select"
            value={selectedApiaryId}
            onChange={(e) => setSelectedApiaryId(e.target.value)}
          >
            {apiaryStats.map((stat) => (
              <option key={stat.apiaryId} value={stat.apiaryId}>
                {stat.region}  {stat.address} ({t('infected')} {stat.infectedCount}{t('count')} / {t('totalTests')} {stat.totalTests})
              </option>
            ))}
          </select>
        </div>

        {/* 선택된 양봉장 통계 */}
        {selectedApiary && (
          <div className="row g-3 g-md-4">
            {/* KPI Cards */}
            <div className="col-12 col-md-3">
              <div className="kpi-card">
                <div className="kpi-title">{t('totalTests')}</div>
                <div className="kpi-value">{selectedApiary.totalTests}</div>
                <div className="kpi-sub">{t('totalTests')}</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="kpi-card">
                <div className="kpi-title">{t('infectedCount')}</div>
                <div className="kpi-value">{selectedApiary.infectedCount}</div>
                <div className="kpi-sub">{t('infected')}</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="kpi-card">
                <div className="kpi-title">{t('uninfected')}</div>
                <div className="kpi-value">{selectedApiary.totalTests - selectedApiary.infectedCount}</div>
                <div className="kpi-sub">{t('uninfected')}</div>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="kpi-card">
                <div className="kpi-title">{t('infectionRate')}</div>
                <div className="kpi-value">{selectedApiary.infectionRate.toFixed(1)}%</div>
                <div className="kpi-sub">{t('infectionRate')}</div>
              </div>
            </div>

            {/* 양봉장 정보 */}
            <div className="col-12">
              <div className="card-soft p-3">
                <h6 className="fw-semibold mb-2">{t('apiaryInfo')}</h6>
                <p className="mb-1"><strong>{t('beekeeper')}:</strong> {selectedApiary.apiaryName}</p>
                <p className="mb-0"><strong>{t('address')}:</strong> {selectedApiary.region} {selectedApiary.address}</p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // Show loading state
  if (loading && mainTab === 'my') {
    return (
      <>
        <Navbar />
        <main className="page">
          <section className="py-4 py-md-5">
            <div className="container">
              <div className="row justify-content-center">
                <div className="col-12 col-xxl-11">
                  <div className="card-soft p-4 p-md-5 text-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">{t('loadingStatistics')}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  // Show login required message
  if (!user) {
    return (
      <>
        <Navbar />
        <main className="page">
          <section className="py-4 py-md-5">
            <div className="container">
              <div className="row justify-content-center">
                <div className="col-12 col-xxl-11">
                  <div className="card-soft p-4 p-md-5 text-center">
                    <h1 className="h4 fw-bold mb-3">{t('statistics')}</h1>
                    <p className="text-muted mb-4">{t('pleaseLoginToView')}</p>
                    <a href="/login" className="btn btn-bee">{t('login')}</a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="py-4 py-md-5">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-12 col-xxl-11">
                <div className="card-soft p-4 p-md-5">
                  <div className="mb-3">
                    <h1 className="h4 fw-bold mb-1">{t('detectionStatistics')}</h1>
                    <div className="text-muted small">
                      {mainTab === 'my' 
                        ? (diagnoses.length > 0 
                          ? t('basedOnData').replace('{count}', diagnoses.length.toString())
                          : t('noDataAvailable'))
                        : (apiaryStats.length > 0 
                          ? t('apiariesAvailable').replace('{count}', apiaryStats.length.toString())
                          : t('noApiaryDataAvailable'))
                      }
                    </div>
                  </div>

                  {/* 메인 탭 */}
                  <ul className="nav nav-pills nav-bee mb-4" role="tablist">
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${mainTab === 'my' ? 'active' : ''}`}
                        onClick={() => setMainTab('my')}
                        type="button"
                      >
                        {t('myStatistics')}
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${mainTab === 'global' ? 'active' : ''}`}
                        onClick={() => setMainTab('global')}
                        type="button"
                      >
                        {t('globalStatistics')}
                      </button>
                    </li>
                  </ul>

                  {/* 탭 컨텐츠 */}
                  <div className="tab-pane" style={{ paddingTop: '1rem' }}>
                    {mainTab === 'my' ? renderMyStatistics() : renderGlobalStatistics()}
                  </div>
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

export default StatisticsPage;
