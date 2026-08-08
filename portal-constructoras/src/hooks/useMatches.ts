'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchMatches } from '@/lib/api/proyectos'
import { useAuth } from '@/hooks/useAuth'

export function useMatches() {
  const { perfilId, isAuth } = useAuth()
  return useQuery({
    queryKey: ['matches', perfilId],
    queryFn: () => fetchMatches(perfilId),
    enabled: isAuth,
  })
}
