import { useState, useEffect } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface ApiaryInfo {
  region: string;
  beekeeper: string;
  address: string;
  lat: number;
  lng: number;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  language: string;
  location: {
    country: string;
  };
  createdAt: Date;
  accountType: 'apiary' | 'user';
  apiaryId?: string;
  apiaryInfo?: ApiaryInfo;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // 사용자 프로필 정보 가져오기
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const register = async (email: string, password: string, displayName: string, username: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Firestore에 사용자 프로필 저장 (일반 유저로 생성)
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email!,
        displayName,
        username,
        language: 'English',
        location: {
          country: 'South Korea'
        },
        accountType: 'user',
        createdAt: new Date()
      };

      await setDoc(doc(db, 'users', result.user.uid), userProfile);
      
      return { success: true, user: result.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    userProfile,
    loading,
    login,
    register,
    logout
  };
};
