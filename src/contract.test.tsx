import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import Ajv2020 from 'ajv/dist/2020'
import schema from '../contract/sion.schema.json'
import pathfindingFixtures from '../contract/fixtures/pathfinding.json'
import { socket, mockUseWebSocket, mockMapCanvas, stubPathfindingFetch, mapClickTarget } from './test/appHarness'
import type { PathfindingResponse, WSMessage } from './types'

vi.mock('./hooks/useWebSocket', () => mockUseWebSocket())
vi.mock('./components/Map/MapCanvas', () => mockMapCanvas())
vi.mock('./components/Status/StatusPanel', () => ({
  default: ({ agvData }: { agvData: unknown }) => <pre data-testid="agv">{JSON.stringify(agvData)}</pre>,
}))

import App from './App'

const ajv = new Ajv2020({ allErrors: true, validateFormats: false })
ajv.addSchema(schema)

const expectMatches = (def: string, value: unknown) => {
  const validate = ajv.getSchema(`${schema.$id}#/$defs/${def}`)
  if (!validate) throw new Error(`no $defs/${def} in the contract schema`)
  expect(validate(value), `${JSON.stringify(value)}\n${ajv.errorsText(validate.errors)}`).toBe(true)
}

interface ServerFixture {
  name: string
  message: WSMessage
}

const serverFixtures = Object.values(
  import.meta.glob<ServerFixture[]>('../contract/fixtures/server/*.json', { eager: true, import: 'default' }),
).flat()

const serverMessageTypes = schema.$defs.ServerMessage.oneOf.map(({ $ref }) => {
  const def = $ref.replace('#/$defs/', '') as keyof typeof schema.$defs
  return (schema.$defs[def] as { properties: { type: { const: string } } }).properties.type.const
})

const agv = () => JSON.parse(screen.getByTestId('agv').textContent ?? 'null')
const mapProps = () => JSON.parse(screen.getByTestId('map-props').textContent ?? 'null')
const deliver = (message: unknown) => act(() => socket.onMessage?.(message as WSMessage))
const wire = (message: unknown) => JSON.parse(JSON.stringify(message))

beforeEach(() => socket.reset())
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('server messages from the contract fixtures', () => {
  it('has a fixture for every server message type in the schema', () => {
    const covered = new Set(serverFixtures.map((f) => f.message.type))
    expect([...covered].sort()).toEqual([...serverMessageTypes].sort())
  })

  it.each(serverFixtures.map((f) => [`${f.message.type}: ${f.name}`, f] as const))('%s', (_title, { message }) => {
    expectMatches('ServerMessage', message)
    render(<App />)
    deliver(message)

    switch (message.type) {
      case 'status': {
        const { detected_enemies, target_enemy, ...status } = message.data
        expect(agv().status).toEqual(status)
        expect(agv().detectedEnemies).toEqual(detected_enemies)
        expect(agv().targetEnemy).toEqual(target_enemy)
        expect(mapProps().targets).toEqual(detected_enemies)
        return
      }
      case 'position':
        expect(agv().position).toEqual(message.data)
        expect(mapProps().agvPosition).toEqual(message.data)
        return
      case 'map_update':
        expect(mapProps().obstacles).toEqual(message.data.obstacles)
        return
      case 'system_info':
        expect(agv().connected).toBe(message.data.agv_connected)
        return
      case 'error':
        expect(screen.getByRole('alert').textContent).toContain(message.data.message)
        return
    }
  })
})

describe('commands sent to the backend match the contract', () => {
  const sentCommands = () => socket.sent.map(wire)

  it('mode toggle', () => {
    render(<App />)
    fireEvent.click(screen.getByText('▶️ 자동 모드'))
    expect(sentCommands().map((c) => c.type)).toEqual(['mode_change'])
    sentCommands().forEach((c) => expectMatches('ClientCommand', c))
  })

  it('emergency stop', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/긴급 정지/))
    expect(sentCommands().map((c) => c.type)).toEqual(['emergency_stop'])
    sentCommands().forEach((c) => expectMatches('ClientCommand', c))
  })

  it('reset after confirmation', async () => {
    render(<App />)
    await act(async () => {
      fireEvent.click(screen.getByText(/초기화/))
    })
    await act(async () => {
      fireEvent.click(screen.getByText('확인'))
    })
    expect(sentCommands()).toEqual([{ type: 'command', data: { action: 'reset' } }])
    sentCommands().forEach((c) => expectMatches('ClientCommand', c))
  })
})

describe('map click against the pathfinding fixtures', () => {
  it.each(pathfindingFixtures.map((f) => [f.name, f] as const))('%s', async (_title, fixture) => {
    const response = fixture.response as PathfindingResponse
    expectMatches('PathfindingResponse', response)
    const calls = stubPathfindingFetch(response)
    render(<App />)
    deliver({ type: 'position', data: { x: 2.4, y: 1.6, angle: 0, timestamp: '2026-10-16T00:00:00Z' }, timestamp: 1 })
    deliver({ type: 'map_update', data: { obstacles: [{ x: 3, y: 3 }], width: 20, height: 20 }, timestamp: 2 })
    await act(async () => {
      fireEvent.click(screen.getByText('map-click'))
    })

    expect(calls).toHaveLength(1)
    expect(calls[0].url).toMatch(/\/api\/pathfinding$/)
    expectMatches('PathfindingRequest', calls[0].body)

    if (response.success) {
      const sent = socket.sent.map(wire)
      expect(sent).toEqual([{
        type: 'command',
        data: { target_x: mapClickTarget.x, target_y: mapClickTarget.y, path: response.path, mode: 'manual' },
      }])
      expectMatches('ClientCommand', sent[0])
    } else {
      expect(socket.sent).toEqual([])
      expect(screen.getByText(`❌ ${response.message}`)).toBeTruthy()
    }
  })
})
