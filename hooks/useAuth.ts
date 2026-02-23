import { useState, useEffect } from 'react';
import { mockUser } from '@/utils/mockData';
import { createUserWithEmailAndPassword, User as FirebaseUser, signInWithEmailAndPassword, signOut, deleteUser, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/api/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { cleanObject } from '@/utils/cleanObject';
import { router, usePathname } from 'expo-router';
import { User } from '@/types/user';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start as true, set false after auth state known
  const pathname = usePathname();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('firebaseUser', firebaseUser);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            // fallback: minimal user info if not in Firestore
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'User',
              createdAt: firebaseUser.metadata.creationTime ?? new Date().toISOString(),
              avatar: firebaseUser.photoURL || undefined,
              over18: true,
              clubs: [],
              courtHistory: [],
              badges: [],
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
        if (!pathname.startsWith('/auth')) {
          router.replace('/auth/login');
          return;
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

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
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle user state
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
      // onAuthStateChanged will handle user state
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
    // user state is handled by onAuthStateChanged
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
        over18: true,
        clubs: [],
        courtHistory: [],
        badges: [],
      }
      await addUserToDb(cleanObject(userData));
      // onAuthStateChanged will handle user state
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