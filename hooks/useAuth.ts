import { useState, useEffect } from 'react';
import { User } from '@/types';
import { mockUser } from '@/utils/mockData';
import { createUserWithEmailAndPassword, User as FirebaseUser, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/firebase/firebase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate authentication check
    const timer = setTimeout(() => {
      // Check if user is logged in (in a real app, check AsyncStorage or secure storage)
      setUser(null); // Start with no user to show auth screens
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

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

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user: FirebaseUser = userCredential.user;
      if (!user) {
        throw new Error('User not found');
      }
      setUser({ ...mockUser, email, name });
    } catch (error: any) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error(errorCode, errorMessage)
      throw new Error(errorCode + " " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = () => {
    return auth.currentUser !== null;
  }

  return {
    user,
    loading,
    login,
    logout,
    register,
  };
};