import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/Layout'
import { Onboarding } from '@/pages/Onboarding'
import { Home } from '@/pages/Home'
import { Write } from '@/pages/Write'
import { Journal } from '@/pages/Journal'
import { Sets } from '@/pages/Sets'
import { Settings } from '@/pages/Settings'
import { AdminSets } from '@/pages/admin/AdminSets'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-bg"><p className="text-text">טוען...</p></div>
  if (!user) return <div className="min-h-screen flex items-center justify-center bg-bg"><p className="text-text">מתחבר...</p></div>
  if (!profile) return <Onboarding />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center">טוען...</div>
  if (!user || !isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        path="/admin/sets"
        element={
          <AdminRoute>
            <AdminSets />
          </AdminRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="write" element={<Write />} />
        <Route path="journal" element={<Journal />} />
        <Route path="sets" element={<Sets />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
