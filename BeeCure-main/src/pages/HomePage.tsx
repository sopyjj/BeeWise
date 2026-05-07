import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AlertModal from '../components/AlertModal';
import { useAuthContext } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { scanService } from '../services/scanService';
import { diagnosisService } from '../services/diagnosisService';
import { reverseGeocode, geocode } from '../services/geocodingService';

// 다음 주소 API 타입 정의
declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: {
          address: string;
          addressType: string;
          bname: string;
          buildingName: string;
          zonecode: string;
          y?: string; // 위도 (latitude)
          x?: string; // 경도 (longitude)
        }) => void;
        onclose?: (state: string) => void;
        width?: string;
        height?: string;
      }) => {
        open: () => void;
      };
    };
  }
}

const HomePage: React.FC = () => {
  const { t } = useLanguage();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [result, setResult] = useState<{
    infected: boolean;
    confidence: number;
    count: number;
  } | null>(null);
  const [todayStats, setTodayStats] = useState({
    total: 0,
    infected: 0
  });
  const [error, setError] = useState<string>('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('Apis mellifera');
  
  // 위치 정보 (일반 유저: GPS, 양봉장: 기본 위치 또는 GPS)
  interface LocationData {
    text: string;
    coordinates?: { lat: number; lng: number };
    type: 'apiary_default' | 'geolocation';
    source: 'apiary_info' | 'gps';
    region?: string;
    address?: string;
  }
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [isManualLocationMode, setIsManualLocationMode] = useState(false);
  const [manualAddressInput, setManualAddressInput] = useState<string>('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  
  // Camera modal state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Alert modal state
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertTitle, setAlertTitle] = useState<string>('');
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | undefined>(undefined);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const { user, userProfile } = useAuthContext();

  // GPS 현재 위치 가져오기
  const getCurrentGPSLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError('');
    setIsManualLocationMode(false);
    setManualAddressInput('');

    try {
      // GPS 위치 요청
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      console.log('📍 GPS 좌표 획득:', lat, lng);

      // Reverse Geocoding: 좌표 → 주소
      let geocodeResult;
      try {
        geocodeResult = await reverseGeocode(lat, lng);
        console.log('📍 주소 변환 완료:', geocodeResult);
      } catch (geocodeError: any) {
        // Geocoding 실패 시에도 좌표는 저장
        console.warn('⚠️ 주소 변환 실패, 좌표만 저장:', geocodeError.message);
        
        // 좌표 기반 기본 주소 문자열 생성
        const defaultAddress = `위치 (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
        
        setCurrentLocation({
          text: defaultAddress,
          coordinates: { lat, lng },
          type: 'geolocation',
          source: 'gps'
        });
        
        setIsLoadingLocation(false);
        // Geocoding 실패는 에러로 표시하지만 좌표는 저장됨
        setLocationError(t('locationGeocodingFailed'));
        return;
      }

      setCurrentLocation({
        text: geocodeResult.address,
        coordinates: { lat, lng },
        type: 'geolocation',
        source: 'gps',
        region: geocodeResult.region,
        address: geocodeResult.addressDetail
      });

      setIsLoadingLocation(false);
    } catch (error: any) {
      console.error('❌ 위치 가져오기 실패:', error);
      setIsLoadingLocation(false);
      
      // 에러 타입별 구체적인 메시지 제공
      let errorMessage = t('locationErrorDefault');
      if (error.code === 1) {
        errorMessage = t('locationErrorPermissionDenied');
      } else if (error.code === 2) {
        errorMessage = t('locationErrorPositionUnavailable');
      } else if (error.code === 3) {
        errorMessage = t('locationErrorTimeout');
      } else if (error.message) {
        // 기타 에러 메시지가 있으면 사용
        errorMessage = error.message;
      }
      
      setLocationError(errorMessage);
      setIsManualLocationMode(true); // 수동 입력 모드로 전환
    }
  };

  // 주소로 위치 검색 (Forward Geocoding)
  const searchAddress = async () => {
    if (!manualAddressInput.trim()) {
      setLocationError(t('errorAddressNotFound'));
      return;
    }

    setIsSearchingAddress(true);
    setLocationError('');

    try {
      console.log('🔍 주소 검색 시작:', manualAddressInput);
      
      // Forward Geocoding: 주소 → 좌표
      const coordinates = await geocode(manualAddressInput.trim());
      console.log('📍 좌표 획득:', coordinates);

      // Reverse Geocoding: 좌표 → 정확한 주소 (확인용)
      let geocodeResult;
      try {
        geocodeResult = await reverseGeocode(coordinates.lat, coordinates.lng);
        console.log('📍 주소 확인 완료:', geocodeResult);
      } catch (geocodeError: any) {
        // Reverse Geocoding 실패 시에도 좌표는 저장
        console.warn('⚠️ 주소 확인 실패, 좌표만 저장:', geocodeError.message);
        
        setCurrentLocation({
          text: manualAddressInput.trim(),
          coordinates: { lat: coordinates.lat, lng: coordinates.lng },
          type: 'geolocation',
          source: 'gps'
        });
        
        setIsSearchingAddress(false);
        setIsManualLocationMode(false);
        setLocationError(t('locationGeocodingFailed'));
        return;
      }

      setCurrentLocation({
        text: geocodeResult.address,
        coordinates: { lat: coordinates.lat, lng: coordinates.lng },
        type: 'geolocation',
        source: 'gps',
        region: geocodeResult.region,
        address: geocodeResult.addressDetail
      });

      setIsSearchingAddress(false);
      setIsManualLocationMode(false);
      setManualAddressInput('');
    } catch (error: any) {
      console.error('❌ 주소 검색 실패:', error);
      // 에러 메시지가 이미 사용자 친화적이면 그대로 사용, 아니면 기본 메시지 사용
      const errorMessage = error.message && !error.message.includes('Geocoding 실패') 
        ? error.message 
        : t('addressConversionFailed');
      setLocationError(errorMessage);
      setIsSearchingAddress(false);
    }
  };

  // 위치 수정 모드 토글
  const toggleLocationEditMode = () => {
    setIsManualLocationMode(!isManualLocationMode);
    if (!isManualLocationMode) {
      // 수동 입력 모드로 전환 시 현재 위치를 입력 필드에 표시
      setManualAddressInput(currentLocation?.text || '');
    } else {
      // 자동 모드로 전환 시 입력 필드 초기화
      setManualAddressInput('');
    }
    setLocationError('');
  };

  // 다음 주소 API 팝업 열기
  const openDaumAddressSearch = () => {
    if (!window.daum || !window.daum.Postcode) {
      setLocationError('주소 검색 서비스를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: async (data) => {
        console.log('📍 다음 주소 API 선택됨:', data);
        
        // 주소 선택 시 실행
        const fullAddress = data.address; // 전체 주소 (사용자가 선택한 정확한 주소)
        const extraAddress = data.addressType === 'R' ? data.bname : ''; // 참고항목
        
        // 기본주소와 참고항목 결합 (사용자가 선택한 정확한 주소)
        let selectedAddress = fullAddress;
        if (extraAddress) {
          selectedAddress += ` ${extraAddress}`;
        }

        console.log('✅ 사용자가 선택한 정확한 주소:', selectedAddress);
        console.log('📍 다음 API에서 제공한 좌표:', data.y, data.x);
        
        // 입력 필드에 주소 설정
        setManualAddressInput(selectedAddress);
        
        try {
          setIsSearchingAddress(true);
          setLocationError('');
          
          let coordinates: { lat: number; lng: number };
          
          // 다음 주소 API에서 좌표를 제공하는 경우 우선 사용
          if (data.y && data.x) {
            console.log('📍 다음 API 좌표 사용:', data.y, data.x);
            coordinates = {
              lat: parseFloat(data.y),
              lng: parseFloat(data.x)
            };
          } else {
            // 좌표가 없는 경우에만 Google Maps Geocoding API로 좌표 조회
            // 주의: 주소는 사용자가 선택한 정확한 주소를 그대로 사용
            console.log('📍 좌표 조회를 위해 Google Maps API 사용...');
            coordinates = await geocode(selectedAddress);
            console.log('✅ 좌표 획득 성공:', coordinates);
          }
          
          // 주소는 사용자가 선택한 정확한 주소를 그대로 사용 (Reverse Geocoding 생략)
          // 지역 정보는 주소에서 추출
          const addressParts = selectedAddress.split(' ');
          let region: string | undefined;
          if (addressParts.length >= 2) {
            // 예: "경기도 광주시 오포읍 양벌로 173" -> "경기도 광주시"
            region = addressParts.slice(0, 2).join(' ');
          }
          
          const newLocation = {
            text: selectedAddress, // 사용자가 선택한 정확한 주소 사용
            coordinates: { lat: coordinates.lat, lng: coordinates.lng },
            type: 'geolocation' as const,
            source: 'gps' as const,
            region: region,
            address: selectedAddress
          };
          
          console.log('📍 위치 정보 업데이트 (선택한 주소 그대로 사용):', newLocation);
          console.log('📍 좌표 확인:', {
            위도: newLocation.coordinates.lat,
            경도: newLocation.coordinates.lng,
            주소: newLocation.text
          });
          setCurrentLocation(newLocation);
          
          // 좌표 저장 확인
          setTimeout(() => {
            console.log('✅ 최종 저장된 위치 정보:', {
              주소: currentLocation?.text,
              좌표: currentLocation?.coordinates,
              지역: currentLocation?.region
            });
          }, 200);
          
          setIsSearchingAddress(false);
          setIsManualLocationMode(false);
          setManualAddressInput('');
          
          console.log('✅ 위치 수정 완료!');
          console.log('   - 주소:', selectedAddress);
          console.log('   - 좌표:', `위도 ${coordinates.lat}, 경도 ${coordinates.lng}`);
        } catch (error: any) {
          console.error('❌ 좌표 조회 실패:', error);
          console.error('에러 상세:', error.message, error.stack);
          
          // 좌표 조회 실패 시에도 사용자가 선택한 주소는 저장
          if (data.y && data.x) {
            // 다음 API에서 좌표를 제공한 경우
            const coordinates = {
              lat: parseFloat(data.y),
              lng: parseFloat(data.x)
            };
            
            const addressParts = selectedAddress.split(' ');
            let region: string | undefined;
            if (addressParts.length >= 2) {
              region = addressParts.slice(0, 2).join(' ');
            }
            
            const newLocation = {
              text: selectedAddress,
              coordinates: coordinates,
              type: 'geolocation' as const,
              source: 'gps' as const,
              region: region,
              address: selectedAddress
            };
            
            setCurrentLocation(newLocation);
            setIsSearchingAddress(false);
            setIsManualLocationMode(false);
            setManualAddressInput('');
            console.log('✅ 다음 API 좌표로 위치 저장 완료');
          } else {
            setLocationError(error.message || '좌표를 조회할 수 없습니다. 주소는 저장되었습니다.');
            setIsSearchingAddress(false);
          }
        }
      },
      onclose: (state) => {
        console.log('📍 주소 검색 팝업 닫힘:', state);
        // 팝업이 닫힐 때 실행
        if (state === 'FORCE_CLOSE') {
          // 사용자가 검색 결과를 선택하지 않고 닫은 경우
          console.log('사용자가 주소를 선택하지 않고 팝업을 닫음');
        } else if (state === 'COMPLETE_CLOSE') {
          // 정상적으로 주소를 선택한 경우 (oncomplete에서 처리됨)
          console.log('주소 선택 완료');
        }
      },
      width: '100%',
      height: '100%'
    }).open();
  };

  // 위치 초기화: 일반 유저는 GPS, 양봉장 계정은 기본 위치
  useEffect(() => {
    const initializeLocation = async () => {
      // 로그인하지 않았을 때는 위치 초기화하지 않음
      if (!user) {
        setCurrentLocation(null);
        return;
      }

      // userProfile이 아직 로딩 중일 때는 기다림
      // accountType이 없으면 기존 사용자이므로 일반 유저로 간주
      const accountType = userProfile?.accountType || 'user';

      // 양봉장 계정: 기본 위치 설정
      if (accountType === 'apiary' && userProfile?.apiaryInfo) {
        const apiaryInfo = userProfile.apiaryInfo;
        setCurrentLocation({
          text: `${apiaryInfo.region} ${apiaryInfo.address}`,
          coordinates: {
            lat: apiaryInfo.lat,
            lng: apiaryInfo.lng
          },
          type: 'apiary_default',
          source: 'apiary_info',
          region: apiaryInfo.region,
          address: apiaryInfo.address
        });
      } 
      // 일반 유저: GPS 자동 감지
      else if (accountType === 'user') {
        await getCurrentGPSLocation();
      }
    };

    initializeLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userProfile]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Fetch today's statistics (Flutter과 동일한 방식)
  useEffect(() => {
    const fetchTodayStats = async () => {
      if (user) {
        console.log('📊 오늘의 진단 결과 조회 시작');
        try {
          const todayDiagnoses = await diagnosisService.getTodayDiagnoses(user.uid);
          console.log('📊 오늘의 총 진단 수:', todayDiagnoses.length);
          
          // Flutter과 동일한 감염 판단 로직
          let infected = 0;
          todayDiagnoses.forEach(diagnosis => {
            const infection = diagnosis.infection?.toLowerCase() || '';
            console.log('📋 진단 결과:', infection);
            
            if (infection === 'yes' || infection === 'mites detected') {
              infected++;
            }
          });
          
          console.log('📊 감염 검출:', infected, '/', todayDiagnoses.length);
          
          setTodayStats({
            total: todayDiagnoses.length,
            infected
          });
        } catch (error) {
          console.error('❌ 오늘의 진단 결과 조회 오류:', error);
          // Set default stats if fetch fails
          setTodayStats({
            total: 0,
            infected: 0
          });
        }
      }
    };

    fetchTodayStats();
  }, [user]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(t('invalidImage'));
      return;
    }
    
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    setResult(null);
  };

  // handleChooseImage는 현재 사용되지 않음 (사진 선택 버튼에서 직접 처리)
  // const handleChooseImage = (e?: React.MouseEvent) => {
  //   ...
  // };

  const handleCameraCapture = async () => {
    // Check if we're on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && cameraInputRef.current) {
      // Mobile: use native camera input
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    } else {
      // Desktop: open camera modal with webcam
      setShowCameraModal(true);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: 1280, height: 720 }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        alert('카메라에 접근할 수 없습니다.');
        setShowCameraModal(false);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCameraModal(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            handleFileSelect(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCameraInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClear = () => {
    setImageFile(null);
    setPreviewUrl('');
    setResult(null);
    setShowHeatmap(false);
    setSelectedSpecies('Apis mellifera');
    // 위치는 초기화하지 않음 (이미 설정된 위치 유지)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    // 로그인하지 않았을 때 (먼저 체크)
    if (!user) {
      setAlertTitle('');
      setAlertMessage(t('pleaseLoginToAnalyzeMessage'));
      setAlertOnConfirm(() => () => navigate('/login'));
      setShowAlertModal(true);
      return;
    }
    
    // 사진이 없을 때
    if (!imageFile) {
      setAlertTitle('');
      setAlertMessage(t('pleaseUploadPhotoFirst'));
      setAlertOnConfirm(undefined);
      setShowAlertModal(true);
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      console.log('📤 이미지 분석 시작...');
      
      // Call the actual API (Flutter과 동일한 방식)
      const scanResult = await scanService.analyzeImage(imageFile);
      console.log('🔍 분석 결과:', scanResult);
      
      // Flutter과 동일한 방식으로 결과 처리
      const isInfected = scanResult.infection === 'yes' || scanResult.infection === 'mites detected';
      const result = {
        infected: isInfected,
        confidence: scanResult.accuracy,
        count: Math.floor(Math.random() * 5) + 1 // Mock count for now
      };
      
      setResult(result);
      console.log('✅ 결과 설정 완료:', result);
      
      // 위치 정보 확인
      if (!currentLocation || !currentLocation.coordinates) {
        throw new Error('위치 정보가 없습니다. 위치를 확인해주세요.');
      }

      // Save to Firestore
      console.log('💾 Firestore에 데이터 저장 시작');
      await diagnosisService.saveDiagnosis({
        userId: user.uid,
        infection: scanResult.infection,
        accuracy: scanResult.accuracy,
        description: scanResult.description,
        species: selectedSpecies,
        location: currentLocation
      });
      console.log('✅ Firestore 저장 완료');
      
      // Update today's stats (Flutter과 동일한 로직)
      const newInfected = isInfected ? 1 : 0;
      setTodayStats(prev => ({
        total: prev.total + 1,
        infected: prev.infected + newInfected
      }));
      console.log('🔄 오늘의 진단 결과 새로고침 완료');
      
      // Navigate to results page
      navigate('/after-detect', { 
        state: { 
          result,
          imageUrl: previewUrl,
          scanResult // Flutter과 동일한 데이터 전달
        } 
      });
      
    } catch (error) {
      console.error('🔥 예외 발생:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
      console.log('📤 이미지 분석 완료');
    }
  };

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="py-4 py-md-5">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-12 col-lg-10 col-xl-9">
                <div className="card-soft p-4 p-md-5">
                  <div className="row g-4 align-items-start">
                    <div className="col-12">
                      <h1 className="h3 fw-bold mb-1">{t('checkPhotoTitle')}</h1>
                      <p className="text-muted mb-3">
                        {t('checkPhotoDesc')}
                      </p>
                    </div>

                    {/* Upload / Preview column */}
                    <div className="col-12 col-md-7">
                      {/* Dropzone - Always visible */}
                      <div
                        className="drop" 
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      >
                        <input 
                          ref={fileInputRef}
                          id="fileInput"
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileInputChange}
                          style={{ display: 'none' }}
                        />
                        <input 
                          ref={cameraInputRef}
                          id="cameraInput"
                          type="file" 
                          accept="image/*" 
                          capture="environment"
                          onChange={handleCameraInputChange}
                          style={{ display: 'none' }}
                        />
                        <div className="hint">
                          <div className="mb-2">{t('dragDropHint')}</div>
                          <div className="d-flex flex-wrap justify-content-center gap-2">
                            <button 
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // React ref를 먼저 시도
                                if (fileInputRef.current) {
                                  fileInputRef.current.click();
                                  return;
                                }
                                
                                // ref가 null인 경우 DOM에서 직접 찾기
                                const fileInput = document.getElementById('fileInput') as HTMLInputElement;
                                if (fileInput) {
                                  fileInput.click();
                                  return;
                                }
                                
                                console.error('❌ fileInput을 찾을 수 없습니다.');
                              }}
                            >
                              {t('chooseImage')}
                            </button>
                            <button 
                              className="btn btn-bee btn-sm" 
                              type="button" 
                              onClick={handleCameraCapture}
                            >
                              {t('takePhoto')}
                            </button>
                          </div>
                          <div className="small mt-2">{t('tipText')}</div>
                        </div>
                      </div>

                      {/* Preview - Show when image is uploaded */}
                      {previewUrl && (
                        <div className="preview-wrap mt-3">
                          <img src={previewUrl} className="preview" alt="Preview" />
                          <canvas 
                            id="heat" 
                            className="overlay-heat" 
                            style={{ opacity: showHeatmap ? 0.9 : 0 }}
                          ></canvas>
                        </div>
                      )}

                      {/* Species Selection and Location Info */}
                      {previewUrl && (
                        <div className="row g-2 mt-3">
                          <div className="col-12">
                            <label className="form-label small fw-semibold">{t('beeSpecies')}</label>
                            <select 
                              className="form-select form-select-sm"
                              value={selectedSpecies}
                              onChange={(e) => setSelectedSpecies(e.target.value)}
                            >
                              <option value="Apis mellifera">{t('apisMellifera')}</option>
                              <option value="Apis cerana">{t('apisCerana')}</option>
                              <option value="Bombus terrestris">{t('bombusTerrestris')}</option>
                              <option value="Apis dorsata">{t('apisDorsata')}</option>
                              <option value="Melipona beecheii">{t('meliponaBeecheii')}</option>
                            </select>
                          </div>
                          
                          {/* Location Info - 로그인한 경우만 표시 */}
                          {user && (
                            <div className="col-12">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="form-label small fw-semibold mb-0">{t('location')}</label>
                                {currentLocation && !isLoadingLocation && (
                                  <button 
                                    className="btn btn-link btn-sm p-0"
                                    onClick={toggleLocationEditMode}
                                    style={{ fontSize: '0.75rem' }}
                                  >
                                    {isManualLocationMode ? '취소' : '위치 수정'}
                                  </button>
                                )}
                              </div>
                              <div className="p-2 rounded" style={{ 
                                background: 'rgba(243,156,18,.1)',
                                border: '1px solid rgba(243,156,18,.2)'
                              }}>
                                {isLoadingLocation || isSearchingAddress ? (
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                    <span className="small text-muted">
                                      {isLoadingLocation ? '위치 정보를 가져오는 중...' : '주소를 검색하는 중...'}
                                    </span>
                                  </div>
                                ) : isManualLocationMode ? (
                                  <div>
                                    <div className="d-flex gap-2 mb-2">
                                      <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="주소를 입력하세요 (예: 서울시 강남구 테헤란로 123)"
                                        value={manualAddressInput}
                                        onChange={(e) => setManualAddressInput(e.target.value)}
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            searchAddress();
                                          }
                                        }}
                                        disabled={isSearchingAddress}
                                        style={{ flex: 1 }}
                                        autoComplete="off"
                                        data-lpignore="true"
                                        data-form-type="other"
                                      />
                                      <button
                                        className="btn btn-sm btn-bee"
                                        onClick={openDaumAddressSearch}
                                        disabled={isSearchingAddress}
                                        title="주소 검색"
                                        style={{ whiteSpace: 'nowrap' }}
                                      >
                                        주소 검색
                                      </button>
                                    </div>
                                    <div className="d-flex gap-2">
                                      <button
                                        className="btn btn-sm btn-bee"
                                        onClick={searchAddress}
                                        disabled={isSearchingAddress || !manualAddressInput.trim()}
                                        style={{ flex: 1 }}
                                      >
                                        검색
                                      </button>
                                      <button
                                        className="btn btn-sm btn-ghost"
                                        onClick={getCurrentGPSLocation}
                                        disabled={isLoadingLocation}
                                        style={{ flex: 1, whiteSpace: 'nowrap' }}
                                      >
                                        현재 위치 사용
                                      </button>
                                    </div>
                                    {locationError && (
                                      <div className="small text-danger mt-2">{locationError}</div>
                                    )}
                                  </div>
                                ) : locationError ? (
                                  <div className="small text-danger">
                                    {locationError}
                                    <button 
                                      className="btn btn-link btn-sm p-0 ms-2"
                                      onClick={getCurrentGPSLocation}
                                    >
                                      다시 시도
                                    </button>
                                  </div>
                                ) : currentLocation ? (
                                  <div>
                                    <div className="small fw-semibold">{currentLocation.text}</div>
                                    <div className="d-flex gap-2 mt-2">
                                      <button 
                                        className="btn btn-sm btn-ghost"
                                        onClick={getCurrentGPSLocation}
                                        disabled={isLoadingLocation}
                                        style={{ whiteSpace: 'nowrap' }}
                                      >
                                        현재 위치 가져오기
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="small text-muted">위치 정보를 가져오는 중...</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Controls */}
                      <div className="d-flex gap-2 mt-3">
                        <button 
                          className="btn-bee" 
                          onClick={handleAnalyze}
                          disabled={isAnalyzing}
                          style={(!imageFile || !user) ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                        >
                          {!user ? t('pleaseLoginToAnalyze') : isAnalyzing ? t('analyzing') : t('analyzePhoto')}
                        </button>
                        <button 
                          className="btn-ghost" 
                          onClick={handleClear}
                          disabled={!imageFile}
                        >
                          {t('clear')}
                        </button>
                        {result && (
                          <div className="form-check ms-auto">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              id="toggleHeat"
                              checked={showHeatmap}
                              onChange={(e) => setShowHeatmap(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="toggleHeat">
                              {t('showHeatmap')}
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Progress */}
                      {isAnalyzing && (
                        <div className="progress mt-3">
                          <div 
                            className="progress-bar" 
                            role="progressbar" 
                            style={{ width: '0%' }}
                          ></div>
                        </div>
                      )}
                    </div>

                    {/* Result column */}
                    <div className="col-12 col-md-5">
                      <div className="p-3 rounded-3" style={{
                        background: 'linear-gradient(180deg,#fffef8,#fff)',
                        border: '1px solid rgba(2,6,23,.06)'
                      }}>
                        <h2 className="h5 fw-bold">{t('result')}</h2>
                        
                        {/* Today's Stats */}
                        {user && (
                          <div className="mb-3 p-2 rounded" style={{ background: 'rgba(243,156,18,.1)' }}>
                            <div className="small fw-semibold text-muted">{t('todaysActivity')}</div>
                            <div className="d-flex gap-3">
                              <span className="small">{t('total')}: <strong>{todayStats.total}</strong></span>
                              <span className="small">{t('infected')}: <strong>{todayStats.infected}</strong></span>
                            </div>
                          </div>
                        )}
                        
                        {/* Error Message */}
                        {error && (
                          <div className="alert alert-danger mb-3" role="alert">
                            {error}
                          </div>
                        )}
                        
                        <div className="mt-2" aria-live="polite">
                          {!result && !previewUrl ? (
                            <p className="text-muted mb-0">{t('uploadHint')}</p>
                          ) : !result && previewUrl ? (
                            <p className="text-muted mb-0">{t('readyToAnalyze')}</p>
                          ) : result ? (
                            <>
                              <div className={`chip ${result.infected ? 'bad' : 'ok'}`}>
                                {result.infected ? t('likelyInfected') : t('unlikelyInfected')}
                                <span className="ms-1 small">({t('confidence')} {(result.confidence * 100).toFixed(1)}%)</span>
                              </div>
                              <div className="small text-muted mt-2">
                                {t('estimatedObjects').replace('{count}', result.count.toString())}
                              </div>
                            </>
                          ) : null}
                        </div>
                        <hr />
                        <div className="d-flex flex-column gap-1 small">
                          <div><strong>{t('guidelines')}</strong></div>
                          <ul className="mb-0 small text-muted">
                            <li>{t('guide1')}</li>
                            <li>{t('guide2')}</li>
                            <li>{t('guide3')}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">사진 촬영</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={stopCamera}
                ></button>
              </div>
              <div className="modal-body text-center">
                <video 
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ 
                    width: '100%', 
                    maxWidth: '600px', 
                    height: 'auto',
                    borderRadius: '8px'
                  }}
                ></video>
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
              </div>
              <div className="modal-footer justify-content-center">
                <button 
                  className="btn btn-ghost me-2" 
                  onClick={stopCamera}
                >
                  취소
                </button>
                <button 
                  className="btn btn-bee" 
                  onClick={capturePhoto}
                >
                  사진 촬영
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        show={showAlertModal}
        onHide={() => setShowAlertModal(false)}
        title={alertTitle}
        message={alertMessage}
        onConfirm={alertOnConfirm}
      />

      <Footer />
    </>
  );
};

export default HomePage;
