import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PriceAlertForm, { type PriceAlertFormValues } from '@/components/PriceAlertForm'

const emptyValues: PriceAlertFormValues = {
  date: '',
  symbol: '',
  levels: [],
}

describe('PriceAlertForm', () => {
  it('shows an error when date is empty', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <PriceAlertForm initialValues={emptyValues} isSubmitting={false} submitError={null} onSubmit={onSubmit} />
    )
    await user.type(screen.getByLabelText('สัญลักษณ์'), 'XAUUSD')
    await user.type(screen.getByLabelText('Resistance 1'), '100')
    await user.click(screen.getByRole('button', { name: 'บันทึก' }))
    expect(screen.getByRole('alert')).toHaveTextContent('กรุณาเลือกวันที่')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows an error when symbol is empty', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <PriceAlertForm initialValues={emptyValues} isSubmitting={false} submitError={null} onSubmit={onSubmit} />
    )
    await user.type(screen.getByLabelText('วันที่'), '2026-01-01')
    await user.type(screen.getByLabelText('Resistance 1'), '100')
    await user.click(screen.getByRole('button', { name: 'บันทึก' }))
    expect(screen.getByRole('alert')).toHaveTextContent('กรุณาระบุสัญลักษณ์')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it.each(['__new__', '__NEW__', '__New__'])(
    'rejects the reserved symbol %j regardless of case',
    async (reservedSymbol) => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(
        <PriceAlertForm initialValues={emptyValues} isSubmitting={false} submitError={null} onSubmit={onSubmit} />
      )
      await user.type(screen.getByLabelText('วันที่'), '2026-01-01')
      await user.type(screen.getByLabelText('สัญลักษณ์'), reservedSymbol)
      await user.type(screen.getByLabelText('Resistance 1'), '100')
      await user.click(screen.getByRole('button', { name: 'บันทึก' }))
      expect(screen.getByRole('alert')).toHaveTextContent('ไม่สามารถใช้สัญลักษณ์นี้ได้')
      expect(onSubmit).not.toHaveBeenCalled()
    }
  )

  it('shows an error when the single level row is entirely empty', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <PriceAlertForm initialValues={emptyValues} isSubmitting={false} submitError={null} onSubmit={onSubmit} />
    )
    await user.type(screen.getByLabelText('วันที่'), '2026-01-01')
    await user.type(screen.getByLabelText('สัญลักษณ์'), 'XAUUSD')
    await user.click(screen.getByRole('button', { name: 'บันทึก' }))
    expect(screen.getByRole('alert')).toHaveTextContent('กรุณากรอกค่า resistance หรือ support')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('drops empty rows and submits only rows with a resistance or support value', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <PriceAlertForm initialValues={emptyValues} isSubmitting={false} submitError={null} onSubmit={onSubmit} />
    )
    await user.type(screen.getByLabelText('วันที่'), '2026-01-01')
    await user.type(screen.getByLabelText('สัญลักษณ์'), 'XAUUSD')
    await user.type(screen.getByLabelText('Resistance 1'), '100')
    await user.click(screen.getByRole('button', { name: 'เพิ่มระดับ' }))
    await user.click(screen.getByRole('button', { name: 'บันทึก' }))

    expect(onSubmit).toHaveBeenCalledWith({
      date: '2026-01-01',
      symbol: 'XAUUSD',
      levels: [{ resistance: 100, support: undefined }],
    })
  })

  it('submits a valid single-row payload with the expected shape', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <PriceAlertForm initialValues={emptyValues} isSubmitting={false} submitError={null} onSubmit={onSubmit} />
    )
    await user.type(screen.getByLabelText('วันที่'), '2026-01-01')
    await user.type(screen.getByLabelText('สัญลักษณ์'), '  XAUUSD  ')
    await user.type(screen.getByLabelText('Resistance 1'), '2400')
    await user.type(screen.getByLabelText('Support 1'), '2350')
    await user.click(screen.getByRole('button', { name: 'บันทึก' }))

    expect(onSubmit).toHaveBeenCalledWith({
      date: '2026-01-01',
      symbol: 'XAUUSD',
      levels: [{ resistance: 2400, support: 2350 }],
    })
  })

  it('prefills from initialValues', () => {
    render(
      <PriceAlertForm
        initialValues={{
          date: '2026-02-01',
          symbol: 'BTCUSD',
          levels: [{ resistance: 60000, support: 55000 }],
        }}
        isSubmitting={false}
        submitError={null}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByLabelText('วันที่')).toHaveValue('2026-02-01')
    expect(screen.getByLabelText('สัญลักษณ์')).toHaveValue('BTCUSD')
    expect(screen.getByLabelText('Resistance 1')).toHaveValue(60000)
    expect(screen.getByLabelText('Support 1')).toHaveValue(55000)
  })

  it('shows the submitError prop when provided and no client-side error is active', () => {
    render(
      <PriceAlertForm
        initialValues={emptyValues}
        isSubmitting={false}
        submitError="เกิดข้อผิดพลาดจากเซิร์ฟเวอร์"
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByRole('alert')).toHaveTextContent('เกิดข้อผิดพลาดจากเซิร์ฟเวอร์')
  })

  it('disables the submit button and shows saving text while isSubmitting', () => {
    render(
      <PriceAlertForm initialValues={emptyValues} isSubmitting={true} submitError={null} onSubmit={vi.fn()} />
    )
    expect(screen.getByRole('button', { name: 'กำลังบันทึก...' })).toBeDisabled()
  })
})
