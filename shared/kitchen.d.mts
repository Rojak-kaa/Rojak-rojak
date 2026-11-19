export const WIDTH: number
export const HEIGHT: number
export const COLORS: string[]
export const SPAWNS: [number, number][]
export type Station = { id: string; kind: string; x: number; y: number }
export const STATIONS: Station[]
export type Method = { label: string; action: string; busy: string; hot: boolean; scale: number }
export const METHODS: Record<string, Method | undefined>
export const INGREDIENTS: Record<string, { name: string; label: string; color: string; chop?: boolean }>
export type Recipe = { name: string; station: string; ingredients: string[]; method: string; color: string; points: number; included?: string }
export const RECIPES: Record<string, Recipe>
export const TRAINING_RECIPES: string[]
export function recipeFor(difficulty: keyof typeof DIFFICULTIES, id: string): Recipe
export function stationsFor(difficulty: keyof typeof DIFFICULTIES, training?: string | null): Station[]
export const DIFFICULTIES: Record<'Easy' | 'Normal' | 'Hard', {
  duration: number; orderLife: number; interval: number; cook: number; burn: number; plates: number; pool: string[]; category: string
}>
export function nearestStation(x: number, y: number, stations?: Station[]): Station | undefined
