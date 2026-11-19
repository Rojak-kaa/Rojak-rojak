import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { INGREDIENTS, nearestStation, SPAWNS, stationsFor } from '../shared/kitchen.mjs'
import { drawChef, drawItem, drawStation, floor, TILE, WORLD_HEIGHT, WORLD_WIDTH } from './art'
import { t } from './i18n'
import type { Player, Room } from './model'

type Props = {
  room?: Room
  me?: string
  onMove?: (x: number, y: number) => void
  onAct?: (action: 'use' | 'work') => void
}

const names: Record<string, string> = {
  board: 'CHOP', pot: 'STOVE', grill: 'GRILL', mix: 'MIX', shave: 'ICE STATION', sink: 'WASH', serve: 'SERVE',
  plates: 'PLATES', dirty: 'RETURN', cups: 'CUPS', cupReturn: 'CUP RETURN', counter: 'TABLE', bin: 'BIN', fryer: 'FRYER'
}

const demo: Player[] = SPAWNS.map(([x, y], color) => ({
  id: String(color), name: ['Pip', 'Miso', 'Bean', 'Sunny'][color],
  x, y, color, connected: true, facing: color % 2 ? -1 : 1,
  ready: true, served: 0, item: color === 1 ? { kind: 'raw', name: 'pineapple' } : color === 2 ? { kind: 'dish', name: 'nasiLemak' } : null
}))

class KitchenScene extends Phaser.Scene {
  constructor(private readonly current: () => Props, private readonly preview: boolean) { super('kitchen') }
  private layer!: Phaser.GameObjects.Graphics
  private keys?: Record<string, Phaser.Input.Keyboard.Key>
  private labels = new Map<string, Phaser.GameObjects.Text>()
  private stationTimers = new Map<string, Phaser.GameObjects.Text>()
  private positions = new Map<string, { x: number; y: number }>()
  private lastSent = 0

  create() {
    floor(this.add.graphics())
    this.layer = this.add.graphics()
    const room = this.current().room
    for (const station of stationsFor(room?.difficulty ?? 'Hard', room?.training, room?.shop)) {
      const caption = station.kind === 'crate' ? INGREDIENTS[station.id].label : names[station.kind]
      if (caption) this.add.text((station.x + 0.5) * TILE, station.y * TILE + 48, t(caption), {
        fontFamily: 'system-ui', fontSize: '8px', fontStyle: 'bold', color: '#5d3840',
        backgroundColor: '#fff2d8', padding: { x: 3, y: 1 }
      }).setOrigin(0.5)
      if (!this.preview && !['crate', 'counter', 'serve', 'plates', 'dirty', 'cups', 'cupReturn', 'bin'].includes(station.kind)) {
        this.stationTimers.set(station.id, this.add.text((station.x + 0.5) * TILE, station.y * TILE + 3, '', {
          fontFamily: 'system-ui', fontSize: '12px', fontStyle: 'bold', color: '#fff8ee',
          backgroundColor: '#392633', padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(3).setVisible(false))
      }
    }
    if (!this.preview && this.input.keyboard) {
      this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT,E,SPACE') as typeof this.keys
      this.input.keyboard.on('keydown-E', (event: KeyboardEvent) => {
        if (!event.repeat) this.current().onAct?.('use')
      })
      this.input.keyboard.on('keydown-SPACE', (event: KeyboardEvent) => {
        if (!event.repeat && !(event.target instanceof HTMLButtonElement)) this.current().onAct?.('work')
      })
    }
  }

  update(time: number, delta: number) {
    const { room, me, onMove } = this.current()
    if (this.keys && time - this.lastSent >= 45) {
      const down = (a: string, b: string) => Number(Boolean(this.keys?.[a].isDown || this.keys?.[b].isDown))
      onMove?.(down('D', 'RIGHT') - down('A', 'LEFT'), down('S', 'DOWN') - down('W', 'UP'))
      this.lastSent = time
    }
    const players = room?.players ?? demo
    const local = players.find(player => player.id === me)
    const stations = stationsFor(room?.difficulty ?? 'Hard', room?.training, room?.shop)
    const active = local && nearestStation(local.x, local.y, stations)?.id
    this.layer.clear()
    for (const station of stations) {
      const simmer = this.preview && station.id === 'potB' ? { item: null, ingredients: [], status: 'cooking', recipe: 'nasiLemak', until: 0 } : undefined
      const state = room?.game?.stations[station.id] ?? simmer
      drawStation(this.layer, station, state, time, station.id === active)
      const label = this.stationTimers.get(station.id)
      if (!label || !room) continue
      if (state?.until && state.status !== 'cooked') {
        label.setText(Math.max(1, Math.ceil((state.until - room.now) / 1000)) + 's').setBackgroundColor('#392633').setVisible(true)
      } else if (state?.status === 'cooked') {
        const seconds = Math.ceil((state.until - room.now) / 1000)
        label.setText(state.until ? t('BURN') + ' ' + Math.max(1, seconds) + 's' : t('READY')).setBackgroundColor(state.until && seconds <= 6 ? '#9e3829' : '#266346').setVisible(true)
      } else if (state?.status === 'burned') {
        label.setText(t('BURNED')).setBackgroundColor('#9e3829').setVisible(true)
      } else {
        label.setVisible(false)
      }
    }
    if (room?.game) {
      for (const { x, y, item } of Object.values(room.game.floorItems)) {
        const cx = (x + 0.5) * TILE
        const cy = (y + 0.6) * TILE
        this.layer.fillStyle(0x52394d, 0.26).fillEllipse(cx, cy + 4, 38, 23)
        drawItem(this.layer, cx, cy, item)
      }
    }
    const visible = new Set(players.map(player => player.id))
    for (const [id, label] of this.labels) {
      if (visible.has(id)) continue
      label.destroy()
      this.labels.delete(id)
      this.positions.delete(id)
    }
    const ordered = [...players].sort((a, b) => a.y - b.y)
    for (const player of ordered) {
      const x = this.preview ? player.x + Math.sin(time / 1600 + player.color) * 0.7 : player.x
      const y = this.preview ? player.y + 0.7 + Math.cos(time / 1600 + player.color * 2) * 0.42 : player.y
      const pos = this.positions.get(player.id) ?? { x, y }
      const moving = Math.hypot(x - pos.x, y - pos.y) > 0.025
      const blend = 1 - Math.exp(-delta / 65)
      pos.x += (x - pos.x) * blend
      pos.y += (y - pos.y) * blend
      this.positions.set(player.id, pos)
      if (me === player.id) this.layer.lineStyle(2, 0xf16c3d).strokeEllipse(pos.x * TILE, pos.y * TILE + 14, 45, 17)
      drawChef(this.layer, player, pos.x * TILE, pos.y * TILE, time, moving)
      if (this.preview) continue
      let label = this.labels.get(player.id)
      if (!label) {
        label = this.add.text(0, 0, player.name, {
          fontFamily: 'system-ui', fontSize: '11px', fontStyle: 'bold', color: '#fff8ef',
          backgroundColor: '#423141', padding: { x: 5, y: 2 }
        }).setOrigin(0.5).setDepth(2)
        this.labels.set(player.id, label)
      }
      label.setPosition(pos.x * TILE, pos.y * TILE + 26).setAlpha(player.connected ? 1 : 0.5)
    }
  }
}

export default function GameCanvas(props: Props) {
  const parent = useRef<HTMLDivElement>(null)
  const latest = useRef(props)
  latest.current = props
  const preview = !props.room

  useEffect(() => {
    if (!parent.current) return
    const game = new Phaser.Game({
      parent: parent.current, type: Phaser.CANVAS, transparent: true,
      width: WORLD_WIDTH, height: WORLD_HEIGHT,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      input: { keyboard: !preview },
      scene: new KitchenScene(() => latest.current, preview)
    })
    return () => { game.destroy(true) }
  }, [preview])

  return <div ref={parent} className="canvas-wrap" role="img" aria-label={preview ? 'Animated preview of four cooks at the Rojak-rojak stall' : 'Live kitchen map'} />
}
