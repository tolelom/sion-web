import type { ClientCommand } from './contract.gen'

export type { AgvMode, ClientCommand } from './contract.gen'

export type SendCommand = (command: ClientCommand) => boolean
