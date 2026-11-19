export type Language = 'en' | 'ms' | 'zh' | 'ta'
export type Outfit = { chef: string; garment: string; accessory: string; fabric: number; trim: number; expression: string; handSign: string; hairStyle: string }
export const LANGUAGES: Record<Language, string>
export const CHEFS: Record<string, { name: string; culture?: string; skin: number; hair: number }>
export const GARMENTS: Record<string, string>
export const ACCESSORIES: Record<string, string>
export const EXPRESSIONS: Record<string, string>
export const HAND_SIGNS: Record<string, string>
export const HAIRSTYLES: Record<string, string>
export const PALETTE: string[]
export const DEFAULT_OUTFIT: Outfit
export const BASE_OUTFIT: Outfit
export const ECO_OUTFIT: Outfit
export const AYU_OUTFIT: Outfit
export const LI_WEN_OUTFIT: Outfit
export const KAVITHA_OUTFIT: Outfit
export const FIXED_OUTFITS: Record<string, Outfit | undefined>
export function hasFixedFabric(chef: string): boolean
