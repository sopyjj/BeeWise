interface ScanResult {
  infection: string;
  accuracy: number;
  description: string;
}

interface ScanResponse {
  infection: string;
  accuracy: number;
  description: string;
}

export const scanService = {
  async analyzeImage(imageFile: File): Promise<ScanResult> {
    try {
      console.log('📤 이미지 분석 시작...');

      // Convert image to base64 (Flutter 방식과 동일)
      const base64Image = await convertToBase64(imageFile);
      console.log('🖼️ Base64 변환 완료, 길이:', base64Image.length);

      // 프록시를 통한 API 호출 (CORS 문제 해결)
      const apiUrl = "https://logncoding.pythonanywhere.com/classify-bee";
      console.log('🌐 API 요청 시작 (프록시 사용):', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image
        })
      });

      console.log('📡 API 응답 상태:', response.status);
      console.log('📡 API 응답 헤더:', response.headers);

      if (response.status === 200) {
        const data: ScanResponse = await response.json();
        console.log('✅ API 응답 데이터:', data);

        return {
          infection: data.infection || 'Unknown',
          accuracy: data.accuracy || 0.0,
          description: data.description || ''
        };
      } else {
        console.log('❌ API 오류:', response.status);

        // 500 오류 (API 키 문제)의 경우 테스트 모드로 전환 (Flutter과 동일)
        if (response.status === 500) {
          console.log('⚠️ 서버 오류 감지. 테스트 모드로 전환합니다.');

          // 임의의 테스트 결과 생성 (Flutter과 동일한 로직)
          const isInfected = Date.now() % 2 === 0;
          const mockAccuracy = 0.75 + (Date.now() % 25) / 100.0;

          const testResult = {
            infection: isInfected ? "mites detected" : "no mites detected",
            accuracy: mockAccuracy,
            description: "⚠️ 테스트 모드: 실제 API 서버에 문제가 있어 임시 결과를 표시합니다. " +
              `${isInfected ? '감염이 감지' : '감염이 감지되지 않았'}습니다.`
          };

          console.log('🔍 테스트 모드 결과:', testResult);
          return testResult;
        } else {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }
      }
    } catch (error) {
      console.error('🔥 예외 발생:', error);
      
      // 네트워크 오류 등의 경우에도 테스트 모드로 전환
      console.log('⚠️ 네트워크 오류 감지. 테스트 모드로 전환합니다.');
      
      const isInfected = Date.now() % 2 === 0;
      const mockAccuracy = 0.75 + (Date.now() % 25) / 100.0;

      return {
        infection: isInfected ? "mites detected" : "no mites detected",
        accuracy: mockAccuracy,
        description: "⚠️ 테스트 모드: 네트워크 오류로 인해 임시 결과를 표시합니다. " +
          `${isInfected ? '감염이 감지' : '감염이 감지되지 않았'}습니다.`
      };
    }
  }
};

// Helper function to convert file to base64
function convertToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => {
      reject(new Error('Failed to convert image to base64'));
    };
    reader.readAsDataURL(file);
  });
}
