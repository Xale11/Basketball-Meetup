import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from './useAuth';
import { auth } from '@/firebase/firebase';

export function useRequireAuth() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !auth.currentUser) {
      router.replace('/auth/login');
    }
  }, [user, loading, auth.currentUser]);

  return null;
}