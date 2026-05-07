# BeCure 🐝

양봉장을 위한 벌 진드기(Varroa Mite) 감염 탐지 및 관리 시스템

## 📋 프로젝트 소개

BeCure는 양봉가들이 벌 사진을 통해 진드기 감염 여부를 빠르게 확인하고, 검사 데이터를 체계적으로 관리할 수 있는 웹 애플리케이션입니다. GPS 기반 위치 추적과 지도 시각화를 통해 지역별 감염 현황을 한눈에 파악할 수 있습니다.

## ✨ 주요 기능

### 🔍 벌 진드기 감염 탐지
- **사진 업로드/촬영**: 벌 또는 봉판 사진을 업로드하거나 직접 촬영
- **AI 기반 분석**: 업로드한 사진을 분석하여 진드기 감염 여부 판단
- **정확도 표시**: 감염 확률과 신뢰도 표시
- **검사 기록 저장**: 모든 검사 결과를 Firestore에 저장

### 📍 위치 기반 서비스
- **자동 위치 감지**: GPS를 통한 현재 위치 자동 추출
- **주소 검색**: 다음 주소 API를 통한 주소 검색
- **수동 주소 입력**: 사용자가 직접 주소 입력 가능
- **위치 수정**: 촬영과 분석 시점이 다를 수 있어 위치 수정 가능

### 🗺️ 양봉장 지도
- **양봉장 위치 표시**: 전국 양봉장 위치를 지도에 표시
- **검사 횟수 표시**: 각 양봉장에서 수행된 검사 횟수 표시
- **검사 위치 마커**: 일반 유저가 검사한 위치를 빨간색 마커로 표시
- **양봉장 구분**: 양봉장 계정이 본인 양봉장에서 검사한 경우 파란색 마커에만 표시

### 📊 통계 대시보드
- **내 통계**: 개인 검사 기록 및 통계
- **전체 통계**: 양봉장별 통계 조회
- **기간별 필터**: 주간/월간/전체 기간 선택
- **차트 시각화**: Chart.js를 활용한 다양한 통계 차트
- **감염률 분석**: 양봉장별 감염률 및 감염 건수 분석

### 👥 사용자 계정 시스템
- **일반 유저**: GPS 기반 자동 위치 감지
- **양봉장 계정**: 기본 양봉장 주소 자동 설정
- **계정별 맞춤 기능**: 계정 유형에 따라 다른 기능 제공

### 🌐 다국어 지원
- 한국어/영어 지원
- 브라우저 언어 설정에 따른 자동 언어 선택

## 🛠️ 기술 스택

### Frontend
- **React 19.2.0**: UI 라이브러리
- **TypeScript**: 타입 안정성
- **React Router**: 라우팅
- **Bootstrap 5**: UI 컴포넌트
- **Leaflet**: 지도 표시
- **Chart.js**: 통계 차트

### Backend & Services
- **Firebase Authentication**: 사용자 인증
- **Firestore**: 데이터베이스
- **Google Maps Geocoding API**: 주소 ↔ 좌표 변환
- **다음 주소 API**: 한국 주소 검색
- **FastAPI**: 이미지 분석 API (프록시 설정)

## 🚀 시작하기

### 사전 요구사항

- Node.js 16.x 이상
- npm 또는 yarn
- Firebase 프로젝트 설정
- Google Maps API 키

### 설치

1. 저장소 클론
```bash
git clone https://github.com/david-han-0831/BeeCure.git
cd BeCure/beecure
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# Firebase 설정
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Google Maps API 키
REACT_APP_GOOGLE_API_KEY=your-google-maps-api-key
```

### 실행

개발 서버 시작:
```bash
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 빌드

프로덕션 빌드:
```bash
npm run build
```

빌드된 파일은 `build` 폴더에 생성됩니다.

## 📁 프로젝트 구조

```
beecure/
├── public/
│   ├── index.html          # HTML 템플릿
│   └── ...
├── src/
│   ├── components/         # 재사용 가능한 컴포넌트
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── LogoutModal.tsx
│   ├── contexts/           # React Context
│   │   ├── AuthContext.tsx
│   │   └── LanguageContext.tsx
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── HomePage.tsx    # 메인 검사 페이지
│   │   ├── MapPage.tsx     # 양봉장 지도
│   │   ├── StatisticsPage.tsx  # 통계 페이지
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── AfterDetectPage.tsx
│   ├── services/           # 서비스 레이어
│   │   ├── diagnosisService.ts    # 진단 데이터 관리
│   │   ├── geocodingService.ts    # 주소 변환
│   │   └── scanService.ts         # 이미지 분석
│   ├── i18n/               # 다국어 번역
│   │   └── translations.ts
│   ├── data/               # 정적 데이터
│   │   └── apiaries.json   # 양봉장 정보
│   ├── hooks/              # 커스텀 훅
│   │   └── useAuth.ts
│   ├── styles/             # 스타일시트
│   │   └── styles.css
│   ├── App.tsx
│   ├── firebase.ts         # Firebase 설정
│   └── index.tsx
└── package.json
```

## 🔑 주요 기능 상세

### 위치 서비스

- **GPS 자동 감지**: 일반 유저는 현재 위치 자동 감지
- **양봉장 기본 위치**: 양봉장 계정은 로그인 시 기본 양봉장 주소 자동 설정
- **주소 검색**: 다음 주소 API를 통한 주소 검색
- **위치 수정**: 분석 전 위치 수정 가능

### 지도 기능

- **양봉장 마커**: 파란색 마커로 양봉장 위치 표시
- **검사 위치 마커**: 빨간색 마커로 일반 검사 위치 표시
- **검사 횟수**: 각 양봉장에서 수행된 검사 횟수 표시
- **위치 필터링**: 같은 위치의 검사는 하나의 마커로 그룹화

### 통계 기능

- **개인 통계**: 자신의 검사 기록 및 통계
- **양봉장 통계**: 양봉장별 전체 검사 수 및 감염률
- **차트 시각화**: 일별/주별/월별 검사 추이
- **종류별 통계**: 꿀벌 종류별 검사 통계

## 📝 사용 방법

### 일반 유저

1. 회원가입 또는 로그인
2. 사진 업로드 또는 촬영
3. 현재 위치 자동 감지 (또는 수동 설정)
4. 분석 실행
5. 결과 확인 및 저장

### 양봉장 계정

1. 양봉장 계정으로 로그인
2. 기본 양봉장 주소 자동 설정
3. 사진 업로드 또는 촬영
4. 필요 시 위치 수정
5. 분석 실행
6. 결과 확인 및 저장 (본인 양봉장 위치면 파란색 마커에 표시)

## 🔧 환경 설정

### Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. Authentication 활성화 (이메일/비밀번호)
3. Firestore Database 생성
4. 웹 앱 설정에서 구성 정보 복사하여 `.env.local`에 추가

### Google Maps API 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. Maps JavaScript API 활성화
3. Geocoding API 활성화
4. API 키 생성 후 `.env.local`에 추가

## 📄 라이선스

이 프로젝트는 비공개 프로젝트입니다.

## 👥 기여자

- David Han

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.
