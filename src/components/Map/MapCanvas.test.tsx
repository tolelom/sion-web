import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, cleanup, act } from '@testing-library/react'
import MapCanvas from './MapCanvas'
import type { Enemy, Point, Position } from '../../types'

// MapCanvas의 그리기 출력을 골든 파일로 고정한다.
// jsdom에는 canvas 구현이 없으므로 getContext를 기록용 컨텍스트로 바꿔
// 메서드 호출(인자, 숫자는 소수 3자리)과 속성 대입을 순서대로 남긴다.
// 캔버스는 getContext를 처음 부른 순서로 이름을 붙인다(정적 레이어가 먼저, 화면 캔버스가 다음).
// 애니메이션은 requestAnimationFrame을 붙잡아 한 프레임씩 직접 돌리고, 시간은 고정한다.

const FIXED_TIME = new Date('2026-10-17T00:00:00.000Z')

let log: string[] = []
let canvasNames = new WeakMap<object, string>()
let canvasCount = 0
let frames: FrameRequestCallback[] = []

const fmt = (value: unknown): string => {
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(3)
  if (Array.isArray(value)) return `[${value.map(fmt).join(',')}]`
  if (value && typeof value === 'object' && canvasNames.has(value)) return canvasNames.get(value) as string
  return JSON.stringify(value)
}

function recordingContext(name: string): CanvasRenderingContext2D {
  const target: Record<string, unknown> = {}
  return new Proxy(target, {
    get(_t, prop) {
      if (typeof prop !== 'string') return undefined
      if (prop in target) return target[prop]
      return (...args: unknown[]) => {
        log.push(`${name}.${prop}(${args.map(fmt).join(', ')})`)
      }
    },
    set(_t, prop, value) {
      target[prop as string] = value
      log.push(`${name}.${String(prop)} = ${fmt(value)}`)
      return true
    },
  }) as unknown as CanvasRenderingContext2D
}

function runFrame() {
  const pending = frames
  frames = []
  act(() => {
    pending.forEach((cb) => cb(FIXED_TIME.getTime()))
  })
}

const enemies: Enemy[] = [
  { id: 'enemy-1', name: '아리', hp: 80, x: 4, y: 5 },
  { id: 'enemy-2', name: '야스오', hp: 40, x: 10.5, y: 12.25 },
  { id: 'enemy-3', name: '', hp: 10, x: 15, y: 3 },
  { id: 'enemy-4', name: '제드', x: 18, y: 18 } as Enemy,
]
const obstacles: Point[] = [{ x: 0, y: 0 }, { x: 3, y: 7 }, { x: 19, y: 19 }]
const userPath: Point[] = [{ x: 2, y: 2 }, { x: 3, y: 3 }, { x: 4, y: 5 }]
const agvPath: Point[] = [{ x: 2, y: 2 }, { x: 2, y: 6 }, { x: 8, y: 6 }]
const agv: Position = { x: 2.25, y: 3.5, angle: 0.785 }

beforeEach(() => {
  log = []
  canvasNames = new WeakMap()
  canvasCount = 0
  frames = []
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(FIXED_TIME)
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    if (!canvasNames.has(this)) {
      canvasCount += 1
      canvasNames.set(this, `canvas${canvasCount}`)
    }
    return recordingContext(canvasNames.get(this) as string) as never
  })
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    frames.push(cb)
    return frames.length
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    log.push(`cancelAnimationFrame(${id})`)
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function scenario(title: string, body: () => void): string {
  log = []
  canvasNames = new WeakMap()
  canvasCount = 0
  frames = []
  body()
  cleanup()
  return [`=== ${title}`, ...log].join('\n')
}

describe('MapCanvas drawing', () => {
  it('matches the golden draw log', async () => {
    const noop = () => {}
    const sections: string[] = []

    sections.push(scenario('empty map, AGV only', () => {
      render(<MapCanvas agvPosition={agv} targets={[]} targetEnemy={null} obstacles={[]} path={[]} agvPath={[]} onMapClick={noop} />)
    }))

    sections.push(scenario('no AGV position', () => {
      render(<MapCanvas agvPosition={undefined} targets={[]} targetEnemy={undefined} obstacles={obstacles} path={[]} agvPath={[]} onMapClick={noop} />)
    }))

    sections.push(scenario('full scene without selection', () => {
      render(<MapCanvas agvPosition={agv} targets={enemies} targetEnemy={null} obstacles={obstacles} path={userPath} agvPath={agvPath} onMapClick={noop} />)
    }))

    sections.push(scenario('selected target animates (selection by id)', () => {
      const { unmount } = render(<MapCanvas agvPosition={agv} targets={enemies} targetEnemy={enemies[1]} obstacles={obstacles} path={userPath} agvPath={agvPath} onMapClick={noop} />)
      log.push('--- frame 1')
      runFrame()
      log.push('--- frame 2')
      runFrame()
      log.push('--- unmount')
      unmount()
    }))

    sections.push(scenario('selection by matching coordinates', () => {
      render(<MapCanvas agvPosition={agv} targets={enemies} targetEnemy={{ id: 'other', name: 'x', hp: 1, x: 15, y: 3 }} obstacles={[]} path={[]} agvPath={[]} onMapClick={noop} />)
      runFrame()
    }))

    sections.push(scenario('hover inside, outside and leave', () => {
      const { container } = render(<MapCanvas agvPosition={agv} targets={[]} targetEnemy={null} obstacles={[]} path={[]} agvPath={[]} onMapClick={noop} />)
      const canvas = container.querySelector('canvas') as HTMLCanvasElement
      log.push('--- move (95, 260)')
      fireEvent.mouseMove(canvas, { clientX: 95, clientY: 260 })
      log.push('--- move (0, 0)')
      fireEvent.mouseMove(canvas, { clientX: 0, clientY: 0 })
      log.push('--- move (600, 10) outside')
      fireEvent.mouseMove(canvas, { clientX: 600, clientY: 10 })
      log.push('--- move (590, 590)')
      fireEvent.mouseMove(canvas, { clientX: 590, clientY: 590 })
      log.push('--- leave')
      fireEvent.mouseLeave(canvas)
    }))

    sections.push(scenario('obstacles change rebuilds the static layer', () => {
      const { rerender } = render(<MapCanvas agvPosition={agv} targets={[]} targetEnemy={null} obstacles={[]} path={[]} agvPath={[]} onMapClick={noop} />)
      log.push('--- rerender with obstacles')
      rerender(<MapCanvas agvPosition={agv} targets={[]} targetEnemy={null} obstacles={obstacles} path={[]} agvPath={[]} onMapClick={noop} />)
    }))

    await expect(sections.join('\n\n') + '\n').toMatchFileSnapshot('./__golden__/MapCanvas.draw.golden.txt')
  })

  it('converts a click into map coordinates', () => {
    const clicks: { x: number; y: number }[] = []
    const { container } = render(<MapCanvas agvPosition={agv} targets={[]} targetEnemy={null} obstacles={[]} path={[]} agvPath={[]} onMapClick={(p) => clicks.push(p)} />)
    const canvas = container.querySelector('canvas') as HTMLCanvasElement
    fireEvent.click(canvas, { clientX: 0, clientY: 0 })
    fireEvent.click(canvas, { clientX: 150, clientY: 450 })
    fireEvent.click(canvas, { clientX: 77, clientY: 512 })
    expect(clicks).toEqual([
      { x: 0, y: 20 },
      { x: 5, y: 5 },
      { x: 77 / 30, y: 20 - 512 / 30 },
    ])
    expect(canvas.width).toBe(600)
    expect(canvas.height).toBe(600)
  })
})
