import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { tokenStore } from '../api/client'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadMe = useCallback(async () => {
    if (!tokenStore.getAccess()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await authApi.getMe()
      setUser(me)
    } catch {
      tokenStore.clear()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMe()
  }, [loadMe])

  const login = useCallback(async (username, password) => {
    const { access, refresh } = await authApi.login(username, password)
    tokenStore.set(access, refresh)
    const me = await authApi.getMe()
    setUser(me)
    return me
  }, [])

  const register = useCallback(async (payload) => {
    await authApi.register(payload)
    return login(payload.username, payload.password)
  }, [login])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    toast.success('Signed out')
  }, [])

  const updateProfile = useCallback(async (payload) => {
    const me = await authApi.updateMe(payload)
    setUser(me)
    return me
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    updateProfile,
    refetch: loadMe,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
