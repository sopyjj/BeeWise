import { addDoc, collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import apiaryData from '../data/apiaries.json';

export interface LocationInfo {
  text: string; // 주소 문자열
  coordinates?: {
    lat: number;
    lng: number;
  };
  type: 'apiary_default' | 'geolocation';
  source: 'apiary_info' | 'gps';
  region?: string;
  address?: string;
}

export interface Diagnosis {
  id?: string;
  userId: string;
  infection: string;
  accuracy: number;
  timestamp: Date;
  description: string;
  species?: string; // 꿀벌 종류
  location?: LocationInfo; // 진단 장소 (확장)
}

export const diagnosisService = {
  async saveDiagnosis(diagnosis: Omit<Diagnosis, 'id' | 'timestamp'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'diagnoses'), {
        ...diagnosis,
        timestamp: Timestamp.now()
      });
      
      console.log('Diagnosis saved with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving diagnosis:', error);
      throw new Error('Failed to save diagnosis');
    }
  },

  async getTodayDiagnoses(userId: string): Promise<Diagnosis[]> {
    try {
      // Simplified query without orderBy to avoid index requirement temporarily
      const q = query(
        collection(db, 'diagnoses'),
        where('userId', '==', userId),
        limit(50) // Limit to recent 50 records
      );

      const querySnapshot = await getDocs(q);
      const diagnoses: Diagnosis[] = [];
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const diagnosisDate = data.timestamp.toDate();
        
        // Filter for today's diagnoses on the client side
        if (diagnosisDate >= startOfDay) {
          diagnoses.push({
            id: doc.id,
            userId: data.userId,
            infection: data.infection,
            accuracy: data.accuracy,
            timestamp: data.timestamp.toDate(),
            description: data.description,
            species: data.species || 'Unknown',
            location: data.location
          });
        }
      });

      // Sort by timestamp descending on client side
      diagnoses.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return diagnoses;
    } catch (error) {
      console.error('Error fetching today diagnoses:', error);
      // Return empty array instead of throwing error to prevent app crash
      return [];
    }
  },

  async getRecentDiagnoses(userId: string, limitCount: number = 10): Promise<Diagnosis[]> {
    try {
      // Simplified query without orderBy to avoid index requirement temporarily
      const q = query(
        collection(db, 'diagnoses'),
        where('userId', '==', userId),
        limit(limitCount * 2) // Get more records to sort on client side
      );

      const querySnapshot = await getDocs(q);
      const diagnoses: Diagnosis[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        diagnoses.push({
          id: doc.id,
          userId: data.userId,
          infection: data.infection,
          accuracy: data.accuracy,
          timestamp: data.timestamp.toDate(),
          description: data.description,
          species: data.species || 'Unknown',
          location: data.location || 'Unknown'
        });
      });

      // Sort by timestamp descending on client side and limit
      diagnoses.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return diagnoses.slice(0, limitCount);
    } catch (error) {
      console.error('Error fetching recent diagnoses:', error);
      // Return empty array instead of throwing error to prevent app crash
      return [];
    }
  },

  // 모든 진단 조회 (지도 표시용) - limit 제거하여 모든 데이터 조회
  async getAllDiagnosesWithLocation(limitCount: number = 50000): Promise<Diagnosis[]> {
    try {
      // limit을 제거하고 모든 데이터 조회 (orderBy로 정렬)
      const q = query(
        collection(db, 'diagnoses'),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const diagnoses: Diagnosis[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // location.coordinates가 있는 것만 필터링
        if (data.location?.coordinates) {
          diagnoses.push({
            id: doc.id,
            userId: data.userId,
            infection: data.infection,
            accuracy: data.accuracy,
            timestamp: data.timestamp.toDate(),
            description: data.description,
            species: data.species || 'Unknown',
            location: data.location
          });
        }
      });

      // limitCount만큼만 반환 (기본값이 크므로 거의 모든 데이터 반환)
      return diagnoses.slice(0, limitCount);
    } catch (error) {
      console.error('Error fetching all diagnoses with location:', error);
      return [];
    }
  },

  // 모든 진단 데이터를 양봉장별로 그룹화하여 통계 조회
  async getAllDiagnosesGroupedByApiary(): Promise<ApiaryStats[]> {
    try {
      // 0. JSON 데이터에서 region과 beekeeper를 키로 하는 주소 매핑 생성
      const apiaryAddressMap = new Map<string, string>();
      (apiaryData as any[]).forEach((apiary) => {
        const region = (apiary.region || '').trim();
        const beekeeper = (apiary.beekeeper || '').trim();
        const key = `${region}|${beekeeper}`;
        apiaryAddressMap.set(key, (apiary.address || '').trim());
      });

      // 1. 모든 진단 데이터 조회
      const diagnosesQuery = query(collection(db, 'diagnoses'));
      const diagnosesSnapshot = await getDocs(diagnosesQuery);
      
      // 2. 모든 사용자 정보 조회 (양봉장 계정만)
      const usersQuery = query(
        collection(db, 'users'),
        where('accountType', '==', 'apiary')
      );
      const usersSnapshot = await getDocs(usersQuery);

      // 3. 사용자 정보를 Map으로 변환 (userId -> userInfo)
      const userMap = new Map<string, any>();
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        userMap.set(doc.id, userData);
      });

      // 4. 양봉장별로 그룹화
      const apiaryStatsMap = new Map<string, {
        apiaryId: string;
        apiaryName: string;
        region: string;
        address: string;
        totalTests: number;
        infectedCount: number;
        location?: { lat: number; lng: number };
      }>();

      // 두 좌표 사이의 거리 계산 함수 (미터 단위)
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

      // 양봉장 위치 목록 생성 (주소 비교용) - 현재 사용하지 않음
      // const apiaryLocations = (apiaryData as any[]).map(apiary => ({
      //   region: (apiary.region || '').trim(),
      //   address: (apiary.address || '').trim(),
      //   fullAddress: `${(apiary.region || '').trim()} ${(apiary.address || '').trim()}`.trim().toLowerCase(),
      //   lat: apiary.lat,
      //   lng: apiary.lng
      // }));

      diagnosesSnapshot.forEach((doc) => {
        const diagnosisData = doc.data();
        const userId = diagnosisData.userId;
        const userInfo = userMap.get(userId);

        // 양봉장 계정의 진단만 집계
        if (userInfo && userInfo.accountType === 'apiary' && userInfo.apiaryId && userInfo.apiaryInfo) {
          // 본인 양봉장 위치에서 검사한 경우만 카운트 (지도와 동일한 로직)
          const diagnosisLocation = diagnosisData.location;
          if (!diagnosisLocation?.coordinates) {
            return; // 위치 정보가 없으면 건너뛰기
          }

          const diagnosisLat = diagnosisLocation.coordinates.lat;
          const diagnosisLng = diagnosisLocation.coordinates.lng;
          const apiaryLat = userInfo.apiaryInfo.lat;
          const apiaryLng = userInfo.apiaryInfo.lng;
          
          // 검사 위치와 양봉장 위치의 거리 계산
          const distance = calculateDistance(diagnosisLat, diagnosisLng, apiaryLat, apiaryLng);
          
          // 주소 비교
          const diagnosisAddress = (diagnosisLocation?.text || '').trim().toLowerCase();
          const userApiaryAddress = `${(userInfo.apiaryInfo.region || '').trim()} ${(userInfo.apiaryInfo.address || '').trim()}`.trim().toLowerCase();
          const addressMatch = diagnosisAddress === userApiaryAddress;
          
          // 500m 이내 또는 주소가 일치하면 카운트 (지도와 동일한 조건)
          if (distance > 500 && !addressMatch) {
            return; // 본인 양봉장 위치에서 검사한 것이 아니면 건너뛰기
          }

          const apiaryId = userInfo.apiaryId;
          
          if (!apiaryStatsMap.has(apiaryId)) {
            const beekeeper = (userInfo.apiaryInfo?.beekeeper || userInfo.displayName || 'Unknown').trim();
            const region = (userInfo.apiaryInfo?.region || 'Unknown').trim();
            
            // JSON 데이터에서 주소 찾기 (region과 beekeeper로 매칭)
            const apiaryKey = `${region}|${beekeeper}`;
            let address = (userInfo.apiaryInfo?.address || '').trim();
            
            // Firestore에 주소가 없거나 빈 문자열이면 JSON 데이터에서 찾기
            if (!address || address === '') {
              const jsonAddress = apiaryAddressMap.get(apiaryKey);
              if (jsonAddress) {
                address = jsonAddress;
              } else {
                // JSON 데이터에도 없으면 '주소 정보 없음' 표시
                address = '주소 정보 없음';
              }
            }
            
            apiaryStatsMap.set(apiaryId, {
              apiaryId: apiaryId,
              apiaryName: beekeeper,
              region: region,
              address: address,
              totalTests: 0,
              infectedCount: 0,
              location: userInfo.apiaryInfo ? {
                lat: userInfo.apiaryInfo.lat,
                lng: userInfo.apiaryInfo.lng
              } : undefined
            });
          }

          const stats = apiaryStatsMap.get(apiaryId)!;
          stats.totalTests++;
          
          const infection = diagnosisData.infection?.toLowerCase() || '';
          if (infection === 'yes' || infection === 'mites detected') {
            stats.infectedCount++;
          }
        }
      });

      // 5. ApiaryStats 배열로 변환
      const apiaryStats: ApiaryStats[] = Array.from(apiaryStatsMap.values()).map(stats => ({
        ...stats,
        infectionRate: stats.totalTests > 0 
          ? Math.round((stats.infectedCount / stats.totalTests) * 100 * 100) / 100 
          : 0
      }));

      // 6. 양봉장 이름 또는 지역으로 정렬
      apiaryStats.sort((a, b) => {
        const nameA = `${a.region} ${a.apiaryName}`;
        const nameB = `${b.region} ${b.apiaryName}`;
        return nameA.localeCompare(nameB);
      });

      return apiaryStats;
    } catch (error) {
      console.error('Error fetching diagnoses grouped by apiary:', error);
      return [];
    }
  },

  // 특정 양봉장의 모든 진단 데이터 조회
  async getDiagnosesByApiaryId(apiaryId: string): Promise<Diagnosis[]> {
    try {
      // 1. 해당 apiaryId를 가진 사용자 찾기
      const usersQuery = query(
        collection(db, 'users'),
        where('accountType', '==', 'apiary'),
        where('apiaryId', '==', apiaryId)
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        return [];
      }

      // 2. 해당 사용자들의 userId 목록
      const userIds = usersSnapshot.docs.map(doc => doc.id);

      // 3. 각 사용자의 진단 데이터 조회
      const allDiagnoses: Diagnosis[] = [];
      
      for (const userId of userIds) {
        const diagnosesQuery = query(
          collection(db, 'diagnoses'),
          where('userId', '==', userId)
        );
        const diagnosesSnapshot = await getDocs(diagnosesQuery);
        
        diagnosesSnapshot.forEach((doc) => {
          const data = doc.data();
          allDiagnoses.push({
            id: doc.id,
            userId: data.userId,
            infection: data.infection,
            accuracy: data.accuracy,
            timestamp: data.timestamp.toDate(),
            description: data.description,
            species: data.species || 'Unknown',
            location: data.location
          });
        });
      }

      // 4. 시간순 정렬
      allDiagnoses.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      return allDiagnoses;
    } catch (error) {
      console.error('Error fetching diagnoses by apiary ID:', error);
      return [];
    }
  }
};

// 양봉장별 통계 인터페이스
export interface ApiaryStats {
  apiaryId: string;
  apiaryName: string; // 양봉가 이름
  region: string; // 지역
  address: string; // 주소
  totalTests: number; // 전체 검사 수
  infectedCount: number; // 감염 건수
  infectionRate: number; // 감염률 (%)
  location?: {
    lat: number;
    lng: number;
  };
}
