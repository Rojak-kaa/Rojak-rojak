import { useEffect, useRef } from 'react'
import type { PointerEvent } from 'react'
import { t } from './i18n'

export type Direction = { x: number; y: number }

const directions = [
  { id: 'up', label: 'Move up', symbol: '▲', x: 0, y: -1 },
  { id: 'left', label: 'Move left', symbol: '◀', x: -1, y: 0 },
  { id: 'down', label: 'Move down', symbol: '▼', x: 0, y: 1 },
  { id: 'right', label: 'Move right', symbol: '▶', x: 1, y: 0 }
]

export default function TouchControls({ onDirection, onAction }: {
  onDirection: (direction: Direction) => void
  onAction: (action: 'use' | 'work') => void
}) {
  const held = useRef(new Map<number, Direction>())
  const notify = useRef(onDirection)
  notify.current = onDirection

  useEffect(() => {
    function clear() {
      held.current.clear()
      notify.current({ x: 0, y: 0 })
    }
    window.addEventListener('blur', clear)
    document.addEventListener('visibilitychange', clear)
    return () => {
      window.removeEventListener('blur', clear)
      document.removeEventListener('visibilitychange', clear)
      clear()
    }
  }, [])

  function update() {
    let x = 0
    let y = 0
    for (const direction of held.current.values()) {
      x += direction.x
      y += direction.y
    }
    notify.current({ x: Math.sign(x), y: Math.sign(y) })
  }

  function press(event: PointerEvent<HTMLButtonElement>, direction: Direction) {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    held.current.set(event.pointerId, direction)
    update()
  }

  function release(event: PointerEvent<HTMLButtonElement>) {
    if (held.current.delete(event.pointerId)) update()
  }

  function runAction(event: PointerEvent<HTMLButtonElement>, action: 'use' | 'work') {
    if (event.button !== 0) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (event.clientX >= bounds.left && event.clientX <= bounds.right &&
        event.clientY >= bounds.top && event.clientY <= bounds.bottom) onAction(action)
  }

  return <div className="touch-controls" role="group" aria-label={t('On-screen controls')}>
    <div className="direction-pad">
      {directions.map(direction => <button type="button" key={direction.id} className={'pad-' + direction.id}
        aria-label={t(direction.label)} onPointerDown={event => press(event, direction)}
        onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>{direction.symbol}</button>)}
    </div>
    <div className="touch-actions">
      <button type="button" className="button primary" onPointerUp={event => runAction(event, 'use')}
        onClick={event => { if (event.detail === 0) onAction('use') }}>{t('Use')}</button>
      <button type="button" className="button secondary" onPointerUp={event => runAction(event, 'work')}
        onClick={event => { if (event.detail === 0) onAction('work') }}>{t('Work')}</button>
    </div>
  </div>
}
