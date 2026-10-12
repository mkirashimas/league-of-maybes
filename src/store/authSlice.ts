import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthState {
  user: AuthUser | null;
  /** True once Firebase has reported the initial auth state. */
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
      state.initialized = true;
    },
  },
});

export const { setUser } = authSlice.actions;
export const authReducer = authSlice.reducer;

export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthInitialized = (state: { auth: AuthState }) => state.auth.initialized;
