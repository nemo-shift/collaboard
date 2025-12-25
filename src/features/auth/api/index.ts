// Auth API functions
// 인증 관련 API 호출 함수
export {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  getCurrentUser,
  getSession,
  resetPasswordForEmail,
  updatePassword,
} from './supabase/google-auth';

export {
  getUser,
  getUsers,
  updateUser,
  // Backward compatibility
  getUserProfile,
  getUserProfiles,
  updateUserProfile,
} from './supabase/users';

