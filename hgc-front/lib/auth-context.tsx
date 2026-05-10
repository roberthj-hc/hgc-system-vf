"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { API_URL } from "@/lib/config"

// ============================================================
// Types
// ============================================================

export interface AuthUser {
  id: number
  nombre: string
  email: string
  cargo: string
  nivel: string
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: SignupData) => Promise<void>
  logout: () => void
}

interface SignupData {
  nombre: string
  email: string
  password: string
  cargo: string
}

// ============================================================
// Context
// ============================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Hidratar desde localStorage al montar
  useEffect(() => {
    const storedToken = localStorage.getItem("hgc_token")
    const storedUser = localStorage.getItem("hgc_user")

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("hgc_token")
        localStorage.removeItem("hgc_user")
      }
    }

    setLoading(false)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al iniciar sesión")
      }

      const data = await res.json()

      localStorage.setItem("hgc_token", data.token)
      localStorage.setItem("hgc_user", JSON.stringify(data.user))

      setToken(data.token)
      setUser(data.user)

      router.push("/system")
    },
    [router],
  )

  const signup = useCallback(
    async (signupData: SignupData) => {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al registrarse")
      }

      // Redirect to login on successful signup
      router.push("/auth/login")
    },
    [router],
  )

  const logout = useCallback(() => {
    localStorage.removeItem("hgc_token")
    localStorage.removeItem("hgc_user")
    setToken(null)
    setUser(null)
    router.push("/auth/login")
  }, [router])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  return context
}
