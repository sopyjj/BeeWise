import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../contexts/LanguageContext';
import apiaryData from '../data/apiaries.json';
import { diagnosisService } from '../services/diagnosisService';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase';
import { geocode } from '../services/geocodingService';
import 'leaflet/dist/leaflet.css';


// Fix for default markers in react-leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// 일반 유저 핀 아이콘 생성 (빨간색)
const UserLocationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// 검색 결과 위치 마커 아이콘 (파란색)
const SearchLocationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// 지도 중심 이동을 위한 컴포넌트
const ChangeMapView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
};

interface ApiaryJson {
  region: string;
  beekeeper: string;
  address: string;
  lat: number;
  lng: number;
}

interface Apiary {
  id: string;
  name: string;
  region: string;
  beekeeper: string;
  address: string;
  coords: [number, number];
  lastScan: string;
  lastScanDate?: Date; // 원본 날짜 객체 (언어별 포맷팅용)
  testCount: number; // 해당 양봉장에서 검사한 횟수
  notes: string;
  image?: string;
}

// Component to handle marker clicks
const ClickableMarker: React.FC<{
  apiary: Apiary;
  onMarkerClick: () => void;
  t: (key: string) => string;
}> = ({ apiary, onMarkerClick, t }) => {
  const markerRef = React.useRef<L.Marker>(null);

  React.useEffect(() => {
    const marker = markerRef.current;
    if (marker) {
      marker.on('click', () => {
        onMarkerClick();
      });
    }
  }, [onMarkerClick]);

  return (
    <Marker position={apiary.coords} ref={markerRef} />
  );
};

interface UserLocationMarker {
  id: string;
  coordinates: [number, number];
  text: string;
  count: number; // 해당 위치에서 검사한 횟수
  userId: string;
}

const MapPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [userLocations, setUserLocations] = useState<UserLocationMarker[]>([]);
  
  // Load apiary data from JSON file
  useEffect(() => {
    const loadApiaryData = () => {
      const loadedApiaries: Apiary[] = (apiaryData as ApiaryJson[]).map((item, index) => {
        return {
          id: `apiary-${index + 1}`,
          name: `${item.region} - ${item.beekeeper}`,
          region: item.region,
          beekeeper: item.beekeeper,
          address: item.address,
          coords: [item.lat, item.lng],
          lastScan: '',
          testCount: 0,
          notes: `${item.address} 위치의 양봉장입니다.`
        };
      });
      setApiaries(loadedApiaries);
    };
    
    loadApiaryData();
  }, []);

  // Load scan data for each apiary from database (all diagnoses, not just current user)
  useEffect(() => {
    const loadApiaryScanData = async () => {
      try {
        // 모든 진단 데이터 조회 (양봉장 위치 검사 포함) - limit 제거하여 모든 데이터 조회
        const allDiagnoses = await diagnosisService.getAllDiagnosesWithLocation(50000);
        
        // 모든 사용자 정보 조회 (양봉장 계정 확인용)
        const usersSnapshot = await getDocs(query(collection(db, 'users')));
        const userMap = new Map<string, any>();
        usersSnapshot.forEach((doc) => {
          userMap.set(doc.id, doc.data());
        });
        
        // 양봉장 위치 목록 생성 (주소 비교용) - 현재 사용하지 않음
        // const apiaryLocations = (apiaryData as ApiaryJson[]).map(apiary => ({
        //   region: apiary.region.trim(),
        //   address: apiary.address.trim(),
        //   fullAddress: `${apiary.region.trim()} ${apiary.address.trim()}`.trim().toLowerCase(),
        //   lat: apiary.lat,
        //   lng: apiary.lng
        // }));
        
        // Update apiaries with scan data
        setApiaries(prevApiaries => {
          return prevApiaries.map(apiary => {
            const apiaryLat = apiary.coords[0];
            const apiaryLng = apiary.coords[1];
            const apiaryFullAddress = `${apiary.region.trim()} ${apiary.address.trim()}`.trim().toLowerCase();
            
            // 해당 양봉장 위치에서 검사한 진단들 찾기 (좌표 + 주소 기반)
            // 양봉장 계정이 본인 양봉장 위치에서 검사한 경우만 카운트
            const apiaryDiagnoses = allDiagnoses.filter(d => {
              if (!d.location?.coordinates) return false;
              
              const lat = d.location.coordinates.lat;
              const lng = d.location.coordinates.lng;
              const distance = calculateDistance(lat, lng, apiaryLat, apiaryLng);
              const diagnosisAddress = (d.location?.text || '').trim().toLowerCase();
              
              // 양봉장 계정만 카운트
              const userInfo = userMap.get(d.userId);
              if (!userInfo || userInfo.accountType !== 'apiary' || !userInfo.apiaryInfo) {
                return false;
              }
              
              const userApiaryLat = userInfo.apiaryInfo.lat;
              const userApiaryLng = userInfo.apiaryInfo.lng;
              
              // 사용자의 양봉장 좌표와 현재 양봉장 좌표가 같은지 확인
              const userApiaryDistance = calculateDistance(userApiaryLat, userApiaryLng, apiaryLat, apiaryLng);
              
              // 주소 비교
              const userApiaryAddress = `${(userInfo.apiaryInfo.region || '').trim()} ${(userInfo.apiaryInfo.address || '').trim()}`.trim().toLowerCase();
              const addressMatch = diagnosisAddress === apiaryFullAddress || diagnosisAddress === userApiaryAddress;
              
              // 사용자의 양봉장이 현재 양봉장이고, 검사 위치도 현재 양봉장 위치인 경우
              // (거리 500m 이내 또는 주소 일치)
              if (userApiaryDistance <= 500 && (distance <= 500 || addressMatch)) {
                return true;
              }
              
              return false;
            });

            if (apiaryDiagnoses.length > 0) {
              // 최근 검사 날짜
              const lastDiagnosis = apiaryDiagnoses.sort((a, b) => 
                b.timestamp.getTime() - a.timestamp.getTime()
              )[0];
              const lastScan = lastDiagnosis.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              
              return { 
                ...apiary, 
                lastScan,
                lastScanDate: lastDiagnosis.timestamp, // 원본 Date 객체 저장
                testCount: apiaryDiagnoses.length
              };
            }
            
            return { ...apiary, testCount: 0 };
          });
        });
      } catch (error) {
        console.error('Error loading apiary scan data:', error);
      }
    };

    loadApiaryScanData();
  }, []);

  // 두 좌표 사이의 거리 계산 (미터 단위)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // 지구 반지름 (미터)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 일반 유저 검사 위치 로드 (양봉장 계정의 본인 양봉장 위치 검사 제외)
  useEffect(() => {
    const loadUserLocations = async () => {
      try {
        // 모든 진단 데이터 조회 - limit 제거하여 모든 데이터 조회
        const allDiagnoses = await diagnosisService.getAllDiagnosesWithLocation(50000);
        
        // 모든 사용자 정보 가져오기 (양봉장 계정 확인용)
        const usersSnapshot = await getDocs(query(collection(db, 'users')));
        const userMap = new Map<string, any>();
        usersSnapshot.forEach((doc) => {
          userMap.set(doc.id, doc.data());
        });
        
        // 양봉장 위치 목록 생성 (주소 비교용)
        const apiaryLocations = (apiaryData as ApiaryJson[]).map(apiary => ({
          region: apiary.region.trim(),
          address: apiary.address.trim(),
          fullAddress: `${apiary.region.trim()} ${apiary.address.trim()}`.trim().toLowerCase(),
          lat: apiary.lat,
          lng: apiary.lng
        }));
        
        // 좌표별로 그룹화 (거리 기반 - 50m 이내면 같은 위치로 간주)
        const locationMarkers: UserLocationMarker[] = [];
        
        allDiagnoses.forEach(diagnosis => {
          if (diagnosis.location?.coordinates) {
            const lat = diagnosis.location.coordinates.lat;
            const lng = diagnosis.location.coordinates.lng;
            const diagnosisAddress = (diagnosis.location?.text || '').trim().toLowerCase();
            
            // 사용자 정보 확인
            const userInfo = userMap.get(diagnosis.userId);
            
            // 양봉장 계정인 경우, 본인 양봉장 위치와의 거리 및 주소 확인
            if (userInfo?.accountType === 'apiary' && userInfo?.apiaryInfo) {
              const apiaryLat = userInfo.apiaryInfo.lat;
              const apiaryLng = userInfo.apiaryInfo.lng;
              const distance = calculateDistance(lat, lng, apiaryLat, apiaryLng);
              
              // 양봉장 주소와 비교
              const userApiaryAddress = `${(userInfo.apiaryInfo.region || '').trim()} ${(userInfo.apiaryInfo.address || '').trim()}`.trim().toLowerCase();
              
              // 양봉장 위치와 500m 이내이거나 주소가 같으면 제외
              if (distance <= 500 || diagnosisAddress === userApiaryAddress) {
                return; // 이 진단은 빨간색 마커로 표시하지 않음
              }
            }
            
            // 양봉장 위치 목록과 비교 (양봉장 계정이 아닌 경우도 양봉장 위치면 제외)
            const isApiaryLocation = apiaryLocations.some(apiaryLoc => {
              const distance = calculateDistance(lat, lng, apiaryLoc.lat, apiaryLoc.lng);
              const addressMatch = diagnosisAddress === apiaryLoc.fullAddress;
              return distance <= 500 || addressMatch;
            });
            
            if (isApiaryLocation) {
              return; // 양봉장 위치면 제외
            }
            
            // 기존 마커 중에서 같은 위치로 간주할 수 있는 마커 찾기
            let foundExisting = false;
            const currentAddressText = (diagnosis.location.text || '').trim().toLowerCase();
            
            for (const marker of locationMarkers) {
              const markerLat = marker.coordinates[0];
              const markerLng = marker.coordinates[1];
              const distance = calculateDistance(lat, lng, markerLat, markerLng);
              const markerAddressText = (marker.text || '').trim().toLowerCase();
              
              // 같은 위치로 간주하는 조건:
              // 1. 200m 이내 거리이거나
              // 2. 주소 텍스트가 같으면 (거리에 관계없이)
              const isSameAddress = currentAddressText && markerAddressText && 
                                   currentAddressText === markerAddressText;
              
              if (distance <= 200 || isSameAddress) {
                // 좌표는 평균값으로 업데이트 (중심점 계산)
                const currentCount = marker.count;
                marker.count += 1;
                marker.coordinates[0] = (marker.coordinates[0] * currentCount + lat) / marker.count;
                marker.coordinates[1] = (marker.coordinates[1] * currentCount + lng) / marker.count;
                foundExisting = true;
                break;
              }
            }
            
            // 기존 마커를 찾지 못한 경우 새 마커 추가
            if (!foundExisting) {
              locationMarkers.push({
                id: diagnosis.id || `loc-${Date.now()}-${Math.random()}`,
                coordinates: [lat, lng],
                text: diagnosis.location.text || '위치 정보 없음',
                count: 1,
                userId: diagnosis.userId
              });
            }
          }
        });
        
        setUserLocations(locationMarkers);
      } catch (error) {
        console.error('Error loading user locations:', error);
      }
    };

    loadUserLocations();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredApiaries, setFilteredApiaries] = useState<Apiary[]>(apiaries);
  const [selectedApiary, setSelectedApiary] = useState<Apiary | null>(null);
  const [searchLocation, setSearchLocation] = useState<[number, number] | null>(null);
  const [searchAddress, setSearchAddress] = useState<string>('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Initialize filtered apiaries when apiaries data is loaded
  useEffect(() => {
    setFilteredApiaries(apiaries);
  }, [apiaries]);
  
  // Filter apiaries based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = apiaries.filter(apiary =>
        apiary.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apiary.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apiary.beekeeper.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredApiaries(filtered);
    } else {
      setFilteredApiaries(apiaries);
    }
  }, [searchQuery, apiaries]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredApiaries(apiaries);
      setSearchLocation(null);
      setSearchAddress('');
      return;
    }

    // 먼저 양봉장명으로 검색 시도
    const filtered = apiaries.filter(apiary =>
      apiary.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apiary.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apiary.beekeeper.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filtered.length > 0) {
      // 양봉장명으로 검색 결과가 있으면 필터링만 수행
      setFilteredApiaries(filtered);
      setSearchLocation(null);
      setSearchAddress('');
      
      // 첫 번째 결과 위치로 지도 이동
      if (filtered[0].coords) {
        setSearchLocation([filtered[0].coords[0], filtered[0].coords[1]]);
      }
    } else {
      // 양봉장명 검색 결과가 없으면 주소 검색 시도
      setIsSearchingAddress(true);
      try {
        console.log('🔍 주소 검색 시작:', searchQuery);
        const coordinates = await geocode(searchQuery.trim());
        console.log('📍 주소 검색 결과 좌표:', coordinates);
        
        // 검색된 위치로 지도 이동
        setSearchLocation([coordinates.lat, coordinates.lng]);
        setSearchAddress(searchQuery.trim());
        
        // 양봉장 목록은 그대로 유지 (필터링 해제)
        setFilteredApiaries(apiaries);
      } catch (error: any) {
        console.error('❌ 주소 검색 실패:', error);
        // 주소 검색 실패 시 양봉장명 검색도 실패한 것으로 처리
        alert(error.message || t('errorAddressNotFound') || '주소를 찾을 수 없습니다.');
        setSearchLocation(null);
        setSearchAddress('');
      } finally {
        setIsSearchingAddress(false);
      }
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredApiaries(apiaries);
    setSearchLocation(null);
    setSearchAddress('');
  };

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="py-2 py-md-4">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-12 col-xl-10">
                <div className="card-soft p-4 p-md-5">
                  <div className="mb-3">
                    <div className="mb-3">
                      <h1 className="h4 fw-bold mb-1">{t('apiaryMap')}</h1>
                      <div className="text-muted small">{t('mapSubtitle')}</div>
                    </div>
                    <div className="search-wrap">
                      <input 
                        type="search" 
                        className="form-control" 
                        placeholder={t('searchPlaceholder') || '양봉장명 또는 주소 검색'} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        disabled={isSearchingAddress}
                        autoComplete="off"
                        data-lpignore="true"
                        data-form-type="other"
                      />
                      <button 
                        className="btn-bee" 
                        onClick={handleSearch}
                        disabled={isSearchingAddress}
                        style={{ whiteSpace: 'nowrap', minWidth: '80px' }}
                      >
                        {isSearchingAddress ? '검색 중...' : t('search')}
                      </button>
                      <button 
                        className="btn-ghost" 
                        onClick={handleClearSearch}
                        style={{ whiteSpace: 'nowrap', minWidth: '80px' }}
                      >
                        {t('clear')}
                      </button>
                    </div>
                  </div>

                  <div id="map" className="mb-3" style={{ height: '420px', borderRadius: '12px' }}>
                    <MapContainer
                      center={[36.5, 127.5]}
                      zoom={7}
                      style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                      />
                      {/* 지도 중심 이동 */}
                      {searchLocation && (
                        <ChangeMapView center={searchLocation} zoom={14} />
                      )}
                      {/* 양봉장 핀 */}
                      {filteredApiaries.map((apiary) => (
                        <ClickableMarker 
                          key={apiary.id} 
                          apiary={apiary} 
                          onMarkerClick={() => setSelectedApiary(apiary)}
                          t={t}
                        />
                      ))}
                      {/* 일반 유저 검사 위치 핀 */}
                      {userLocations.map((userLoc) => (
                        <Marker 
                          key={userLoc.id} 
                          position={userLoc.coordinates}
                          icon={UserLocationIcon}
                        >
                          <Popup>
                            <div className="popup-title">검사 위치</div>
                            <div className="popup-meta">{userLoc.text}</div>
                            <div className="small text-muted mt-2">
                              검사 횟수: {userLoc.count}회
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                      {/* 주소 검색 결과 마커 */}
                      {searchLocation && searchAddress && (
                        <Marker position={searchLocation} icon={SearchLocationIcon}>
                          <Popup>
                            <div className="popup-title">검색 위치</div>
                            <div className="popup-meta">{searchAddress}</div>
                          </Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  </div>

                  <div className="small text-muted">
                    {t('totalApiaries').replace('{count}', apiaries.length.toString())}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Detail Modal */}
      {selectedApiary && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-2xl">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {selectedApiary.name || `${selectedApiary.region} - ${selectedApiary.beekeeper}`}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setSelectedApiary(null)}
                ></button>
              </div>
              <div className="modal-body">
                {/* 주소 정보 */}
                <div className="mb-3">
                  <div className="text-muted small mb-1">주소</div>
                  <div className="fw-medium">
                    {selectedApiary.address 
                      ? `${selectedApiary.region} ${selectedApiary.address}`.trim()
                      : selectedApiary.region || '주소 정보 없음'}
                  </div>
                </div>
                
                {/* 검사 정보 */}
                {selectedApiary.testCount > 0 && (
                  <div className="mb-2">
                    <div className="text-muted small mb-1">검사 횟수</div>
                    <div className="fw-medium">{selectedApiary.testCount}회</div>
                  </div>
                )}
                
                {/* 최근 검사 날짜 */}
                {selectedApiary.lastScanDate && (
                  <div className="mb-2">
                    <div className="text-muted small mb-1">최근 검사</div>
                    <div className="fw-medium">
                      {language === 'ko' 
                        ? (() => {
                            const date = selectedApiary.lastScanDate;
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                          })()
                        : selectedApiary.lastScanDate.toLocaleDateString('en-US', { 
                            year: 'numeric',
                            month: 'short', 
                            day: 'numeric' 
                          })
                      }
                    </div>
                  </div>
                )}
                
                {/* 양봉가 정보 */}
                <div className="mb-2">
                  <div className="text-muted small mb-1">양봉가</div>
                  <div className="fw-medium">{selectedApiary.beekeeper}</div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn-ghost" 
                  onClick={() => setSelectedApiary(null)}
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default MapPage;
