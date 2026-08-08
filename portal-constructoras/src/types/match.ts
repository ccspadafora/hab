export interface MatchItem {
  id: number
  publicacion_id: number
  score_match: number | null
  estado: string
  origen: string
  barrio: string
  created_at: string
}

export interface MatchesResponse {
  count: number
  results: MatchItem[]
}
