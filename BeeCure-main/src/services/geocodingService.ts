/**
 * Geocoding Service
 * GPS 좌표를 주소로 변환 (Reverse Geocoding)
 */

interface GeocodingResult {
  address: string;
  region?: string;
  addressDetail?: string;
}

const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error('❌ REACT_APP_GOOGLE_API_KEY가 설정되지 않았습니다.');
  console.error('⚠️ .env.local 파일에 REACT_APP_GOOGLE_API_KEY를 추가해주세요.');
} else {
  console.log('✅ Google Maps API Key 로드됨:', GOOGLE_API_KEY.substring(0, 10) + '...');
}

/**
 * 좌표를 주소로 변환 (Reverse Geocoding)
 * @param lat 위도
 * @param lng 경도
 * @returns 주소 정보
 */
export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<GeocodingResult> => {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google Maps API Key가 설정되지 않았습니다.');
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=ko&key=${GOOGLE_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    // 상세한 에러 로깅
    if (data.status !== 'OK') {
      console.error('❌ Geocoding API 응답:', data.status);
      if (data.error_message) {
        console.error('📋 에러 메시지:', data.error_message);
      }
      if (data.status === 'REQUEST_DENIED') {
        console.error('⚠️ 결제(Billing) 활성화가 필요합니다.');
        console.error('🔗 https://console.cloud.google.com/project//billing/enable');
      }
    } else {
      console.log('✅ Geocoding API 응답:', data.status);
    }

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      const address = result.formatted_address;

      // 한국 주소 형식에서 지역 추출 시도
      // 예: "충청북도 음성군 원남면 충청대로 279번길 54" → region: "충청북도 음성군 원남면"
      let region: string | undefined;
      let addressDetail: string | undefined;

      // address_components에서 지역 정보 추출
      const addressComponents = result.address_components;
      const administrativeArea = addressComponents.find((comp: any) =>
        comp.types.includes('administrative_area_level_1')
      );
      const locality = addressComponents.find((comp: any) =>
        comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')
      );
      const sublocality = addressComponents.find((comp: any) =>
        comp.types.includes('sublocality_level_1') || comp.types.includes('sublocality')
      );

      if (administrativeArea && locality) {
        region = `${administrativeArea.long_name} ${locality.long_name}${sublocality ? ` ${sublocality.long_name}` : ''}`;
      }

      // 상세 주소는 formatted_address 사용
      addressDetail = address;

      return {
        address,
        region,
        addressDetail
      };
    } else {
      // 사용자 친화적인 에러 메시지 제공
      let errorMessage = '주소를 찾을 수 없습니다.';
      if (data.status === 'REQUEST_DENIED') {
        errorMessage = '주소 검색 서비스를 사용할 수 없습니다.';
      } else if (data.status === 'ZERO_RESULTS') {
        errorMessage = '입력하신 주소를 찾을 수 없습니다. 주소를 다시 확인해주세요.';
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        errorMessage = '주소 검색 서비스 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.';
      } else if (data.status === 'INVALID_REQUEST') {
        errorMessage = '주소 형식이 올바르지 않습니다. 다시 입력해주세요.';
      }
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('❌ Reverse Geocoding 오류:', error);
    throw error;
  }
};

/**
 * 주소를 좌표로 변환 (Forward Geocoding) - 향후 필요 시 사용
 * @param address 주소 문자열
 * @returns 좌표
 */
export const geocode = async (
  address: string
): Promise<{ lat: number; lng: number }> => {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google Maps API Key가 설정되지 않았습니다.');
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    // 상세한 에러 로깅
    if (data.status !== 'OK') {
      console.error('❌ Geocoding API 응답:', data.status);
      if (data.error_message) {
        console.error('📋 에러 메시지:', data.error_message);
      }
      if (data.status === 'REQUEST_DENIED') {
        console.error('⚠️ 결제(Billing) 활성화가 필요합니다.');
        console.error('🔗 https://console.cloud.google.com/project//billing/enable');
      }
    } else {
      console.log('✅ Geocoding API 응답:', data.status);
    }

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    } else {
      // 사용자 친화적인 에러 메시지 제공
      let errorMessage = '주소를 찾을 수 없습니다.';
      if (data.status === 'REQUEST_DENIED') {
        errorMessage = '주소 검색 서비스를 사용할 수 없습니다.';
      } else if (data.status === 'ZERO_RESULTS') {
        errorMessage = '입력하신 주소를 찾을 수 없습니다. 주소를 다시 확인해주세요.';
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        errorMessage = '주소 검색 서비스 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.';
      } else if (data.status === 'INVALID_REQUEST') {
        errorMessage = '주소 형식이 올바르지 않습니다. 다시 입력해주세요.';
      }
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('❌ Geocoding 오류:', error);
    throw error;
  }
};
