import { useState, useEffect } from 'react';
import { User } from '@/types';
import { mockUser } from '@/utils/mockData';
import { createUserWithEmailAndPassword, User as FirebaseUser, signInWithEmailAndPassword, signOut, deleteUser } from 'firebase/auth';
import { auth, db } from '@/firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { cleanObject } from '@/utils/cleanObject';
import { router, usePathname } from 'expo-router';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  const addUserToDb = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, user);
    } catch (error) {
      console.error('Error adding user to Firestore:', error);
      throw error;
    }
  }

  const login = async (email: string, password: string) => {
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user: FirebaseUser = userCredential.user;
      if (!user) {
        throw new Error('User not found');
      }
      setUser({ ...mockUser, email, name: user.displayName || 'User' });
    } catch (error: any) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error(errorCode, errorMessage);
      throw new Error(errorCode + " " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
    } catch (error: any) {
      console.error('Logout error:', error.code, error.message);
      throw new Error(error.code + ' ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    if (!auth.currentUser && !pathname.startsWith('/auth')) {
      router.replace('/auth/login');
      return false;
    }

    if (auth.currentUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData: User = userDoc.data() as User;
          setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        return false;
      }
    }
    
    setLoading(false);
    return true;
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    let firebaseUser: FirebaseUser | null = null;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUser = userCredential.user;
      if (!firebaseUser) {
        throw new Error('User not found');
      }
      
      const userData: User = {
        id: firebaseUser.uid,
        email,
        name,
        createdAt: firebaseUser.metadata.creationTime ?? new Date().toISOString(),
        avatar: firebaseUser?.photoURL || undefined,
        isClubAdmin: false,
        clubId: undefined,
      }
      
      await addUserToDb(cleanObject(userData));
      setUser(userData);
    } catch (error: any) {
      // If Firestore upload failed, delete the user from Auth
      if (firebaseUser) {
        try {
          await deleteUser(firebaseUser);
        } catch (deleteError) {
          console.error('Failed to delete user from Auth:', deleteError);
        }
      }
      
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error(errorCode, errorMessage);
      throw new Error(errorCode + " " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    setLoading,
    setUser,
    login,
    logout,
    register,
    checkAuth,
  };
};