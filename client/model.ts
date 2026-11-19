import type { Language, Outfit } from '../shared/profile.mjs'

export type Profile = { id: string; username: string; name: string; language: Language; outfit: Outfit; served: number; outfitConfigured: boolean }
export type Difficulty = 'Easy' | 'Normal' | 'Hard'
export type Item = { kind: 'raw' | 'chopped' | 'fried' | 'plate' | 'cup' | 'dirty' | 'dirtyCup' | 'dish'; name?: string }
export type Player = {
  id: string; name: string; color: number; ready: boolean; connected: boolean
  outfit?: Outfit
  x: number; y: number; facing: number; item: Item | null; served: number
}
export type StationState = {
  item: Item | null; ingredients: string[]; status: string; until: number; recipe?: string
}
export type Order = { id: number; recipe: string; expiresAt: number }
export type Match = {
  solo: boolean; duration: number; orderLife: number
  endsAt: number; score: number; served: number; missed: number; streak: number; bestStreak: number
  clean: number; dirty: number; cleanCups: number; dirtyCups: number; orders: Order[]; stations: Record<string, StationState>
  floorItems: Record<number, { x: number; y: number; item: Item }>
}
export type Room = {
  code: string; host: string; phase: 'lobby' | 'briefing' | 'playing' | 'results'
  difficulty: Difficulty; solo: boolean; training: string | null; shop: string | null; now: number; players: Player[]; game: Match | null
}
