import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useConfirmDialog } from './useConfirmDialog'

describe('useConfirmDialog', () => {
  it('초기 상태는 닫혀 있고 showCancel=true', () => {
    const { result } = renderHook(() => useConfirmDialog())
    expect(result.current.dialogState.isOpen).toBe(false)
    expect(result.current.dialogState.showCancel).toBe(true)
  })

  it('confirm()은 다이얼로그를 열고, handleConfirm 시 true로 resolve', async () => {
    const { result } = renderHook(() => useConfirmDialog())

    let promise!: Promise<boolean>
    act(() => {
      promise = result.current.confirm('정말요?', '확인')
    })

    expect(result.current.dialogState.isOpen).toBe(true)
    expect(result.current.dialogState.message).toBe('정말요?')
    expect(result.current.dialogState.title).toBe('확인')
    expect(result.current.dialogState.showCancel).toBe(true)

    act(() => {
      result.current.handleConfirm()
    })

    await expect(promise).resolves.toBe(true)
    expect(result.current.dialogState.isOpen).toBe(false)
  })

  it('confirm()의 handleCancel은 false로 resolve', async () => {
    const { result } = renderHook(() => useConfirmDialog())

    let promise!: Promise<boolean>
    act(() => {
      promise = result.current.confirm('취소할까요?')
    })

    act(() => {
      result.current.handleCancel()
    })

    await expect(promise).resolves.toBe(false)
    expect(result.current.dialogState.isOpen).toBe(false)
  })

  it('alert()은 showCancel=false로 열린다', async () => {
    const { result } = renderHook(() => useConfirmDialog())

    let promise!: Promise<boolean>
    act(() => {
      promise = result.current.alert('알림')
    })

    expect(result.current.dialogState.showCancel).toBe(false)
    expect(result.current.dialogState.isOpen).toBe(true)

    act(() => {
      result.current.handleConfirm()
    })

    await expect(promise).resolves.toBe(true)
  })
})
