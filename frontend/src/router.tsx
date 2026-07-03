import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense, type ReactNode } from 'react'
import { useAuthStore } from './features/auth/authStore'

const LoginPage               = lazy(() => import('./features/auth/LoginPage'))
const AppLayout               = lazy(() => import('./components/layout/AppLayout'))
const DashboardPage           = lazy(() => import('./features/dashboard/DashboardPage'))
const DashboardFinancieroPage = lazy(() => import('./features/dashboard/DashboardFinancieroPage'))
const PrediosPage             = lazy(() => import('./features/predios/PrediosPage'))
const PredioDetailPage        = lazy(() => import('./features/predios/PredioDetailPage'))
const ViabilidadDetailPage    = lazy(() => import('./features/viabilidad/ViabilidadDetailPage'))
const LeadsKanbanPage         = lazy(() => import('./features/leads/LeadsKanbanPage'))
const LeadDetailPage          = lazy(() => import('./features/leads/LeadDetailPage'))
const PropietariosPage        = lazy(() => import('./features/propietarios/PropietariosPage'))
const PropietarioDetailPage   = lazy(() => import('./features/propietarios/PropietarioDetailPage'))
const CalendarioPage          = lazy(() => import('./features/leads/CalendarioPage'))
const ChatPage                = lazy(() => import('./features/bot/ChatPage'))
const ProyectosPipelinePage   = lazy(() => import('./features/proyectos/ProyectosPipelinePage'))
const ProyectoDetailPage      = lazy(() => import('./features/proyectos/ProyectoDetailPage'))
const EstructuracionPage      = lazy(() => import('./features/proyectos/EstructuracionPage'))
const IAConocimientoPage      = lazy(() => import('./features/ia/IAConocimientoPage'))
const IAPromptsPage           = lazy(() => import('./features/ia/IAPromptsPage'))
const ScrapingConfigPage      = lazy(() => import('./features/configuracion/ScrapingConfigPage'))
const IAConfigPage            = lazy(() => import('./features/configuracion/IAConfigPage'))
const UsuariosPage            = lazy(() => import('./features/usuarios/UsuariosPage'))
const PermisosPage            = lazy(() => import('./features/usuarios/PermisosPage'))

const S = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<div style={{ padding: 32, color: '#888' }}>Cargando...</div>}>
    {children}
  </Suspense>
)

function PrivateRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) {
  const { isAuth, user } = useAuthStore()
  if (!isAuth) return <Navigate to="/login" replace />
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

export const router = createBrowserRouter([
  { path: '/login', element: <S><LoginPage /></S> },
  {
    path: '/',
    element: <PrivateRoute><S><AppLayout /></S></PrivateRoute>,
    children: [
      { index: true,                          element: <S><DashboardPage /></S> },
      { path: 'predios',                      element: <S><PrediosPage /></S> },
      { path: 'predios/:id',                  element: <S><PredioDetailPage /></S> },
      { path: 'viabilidad/:id',               element: <S><ViabilidadDetailPage /></S> },
      { path: 'leads',                        element: <S><LeadsKanbanPage /></S> },
      { path: 'leads/:id',                    element: <S><LeadDetailPage /></S> },
      { path: 'propietarios',                 element: <S><PropietariosPage /></S> },
      { path: 'propietarios/:id',             element: <S><PropietarioDetailPage /></S> },
      { path: 'calendario',                   element: <S><CalendarioPage /></S> },
      { path: 'chat',                         element: <S><ChatPage /></S> },
      { path: 'proyectos',                    element: <S><ProyectosPipelinePage /></S> },
      { path: 'proyectos/:id',                element: <S><ProyectoDetailPage /></S> },
      { path: 'proyectos/:id/estructuracion', element: <S><EstructuracionPage /></S> },
      {
        path: 'financiero',
        element: (
          <PrivateRoute allowedRoles={['admin', 'gerente']}>
            <S><DashboardFinancieroPage /></S>
          </PrivateRoute>
        ),
      },
      { path: 'ia/conocimiento',           element: <S><IAConocimientoPage /></S> },
      { path: 'ia/prompts',                element: <S><IAPromptsPage /></S> },
      { path: 'configuracion/scraping',    element: <S><ScrapingConfigPage /></S> },
      { path: 'configuracion/ia',          element: <S><IAConfigPage /></S> },
      { path: 'usuarios',                  element: <S><UsuariosPage /></S> },
      { path: 'usuarios/permisos',         element: <S><PermisosPage /></S> },
    ],
  },
])
