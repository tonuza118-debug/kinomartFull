import { api } from './client'

export async function register(payload) {
  // payload: { username, email, password, first_name?, last_name?, phone_number? }
  const { data } = await api.post('/auth/register/', payload)
  return data
}

export async function login(username, password) {
  const { data } = await api.post('/auth/login/', { username, password })
  return data // { access, refresh }
}

export async function refreshToken(refresh) {
  const { data } = await api.post('/auth/refresh/', { refresh })
  return data // { access }
}

export async function getMe() {
  const { data } = await api.get('/auth/me/')
  return data
}

export async function updateMe(payload) {
  const { data } = await api.patch('/auth/me/', payload)
  return data
}
