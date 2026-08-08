'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  expresarInteres,
  fetchProyecto,
  fetchProyectos,
} from '@/lib/api/proyectos'
import type { ProyectoFilters } from '@/types/proyecto'

export function useProyectos(filters: ProyectoFilters) {
  return useQuery({
    queryKey: ['proyectos', filters],
    queryFn: () => fetchProyectos(filters),
  })
}

export function useProyecto(id: number | string) {
  return useQuery({
    queryKey: ['proyecto', id],
    queryFn: () => fetchProyecto(id),
    enabled: !!id,
  })
}

export function useExpresarInteres() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, nota }: { id: number; nota: string }) => expresarInteres(id, nota),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['proyectos'] })
      qc.invalidateQueries({ queryKey: ['proyecto', String(vars.id)] })
      qc.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}
