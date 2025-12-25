'use client';

import { create } from 'zustand';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { getCurrentUser, getSession } from '@features/auth/api';
import type { User } from '@entities/user';

interface AuthState {
  user: SupabaseUser | null;
  userProfile: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAnonymous: boolean; // 어나니머스 상태
  
  // Actions
  setUser: (user: SupabaseUser | null) => void;
  setUserProfile: (profile: User | null) => void;
  setAnonymous: (isAnonymous: boolean) => void; // 어나니머스 설정
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  isLoading: false,
  isInitialized: false,
  isAnonymous: true, // 기본값은 어나니머스

  setUser: (user) => {
    set({ user, isAnonymous: !user }); // 유저가 없으면 어나니머스
    // Supabase user를 User 타입으로 변환
    if (user) {
      set({
        userProfile: {
          id: user.id,
          email: user.email || '',
          displayName: user.user_metadata?.full_name || user.user_metadata?.name || undefined,
          avatarUrl: user.user_metadata?.avatar_url || undefined,
          createdAt: user.created_at,
        },
      });
    } else {
      set({ userProfile: null });
    }
  },

  setAnonymous: (isAnonymous) => {
    set({ isAnonymous });
  },

  setUserProfile: (profile) => set({ userProfile: profile }),

  initialize: async () => {
    if (get().isInitialized) return;
    
    set({ isLoading: true });
    try {
      const session = await getSession();
      if (session?.user) {
        get().setUser(session.user);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  refreshUser: async () => {
    set({ isLoading: true });
    try {
      const user = await getCurrentUser();
      get().setUser(user);
    } catch (error) {
      console.error('Refresh user error:', error);
      get().clearAuth();
    } finally {
      set({ isLoading: false });
    }
  },

  clearAuth: () => {
    set({
      user: null,
      userProfile: null,
      isInitialized: true,
    });
  },
}));

