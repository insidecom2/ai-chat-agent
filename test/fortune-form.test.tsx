import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FortuneForm, { type FortuneFormValues } from '@/components/FortuneForm'

const emptyValues: FortuneFormValues = { fullName: '', birthDate: '', topics: [], extraText: '' }

describe('FortuneForm', () => {
  it('shows an error when name and birth date are empty', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<FortuneForm initialValues={emptyValues} onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: 'ดูดวง' }))
    expect(screen.getByRole('alert')).toHaveTextContent('กรุณากรอก')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits trimmed values when name and birth date are filled', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<FortuneForm initialValues={emptyValues} onSubmit={onSubmit} />)
    await user.type(screen.getByLabelText('ชื่อ-นามสกุล'), 'สมชาย ใจดี')
    await user.type(screen.getByLabelText('วันเดือนปีเกิด'), '1990-01-01')
    await user.click(screen.getByRole('button', { name: 'ดูดวง' }))
    expect(onSubmit).toHaveBeenCalledWith({
      fullName: 'สมชาย ใจดี',
      birthDate: '1990-01-01',
      topics: [],
      extraText: '',
    })
  })

  it('toggles topics and passes them to onSubmit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<FortuneForm initialValues={emptyValues} onSubmit={onSubmit} />)
    await user.type(screen.getByLabelText('ชื่อ-นามสกุล'), 'สมชาย ใจดี')
    await user.type(screen.getByLabelText('วันเดือนปีเกิด'), '1990-01-01')
    await user.click(screen.getByLabelText('งาน'))
    await user.click(screen.getByLabelText('เงิน'))
    await user.click(screen.getByRole('button', { name: 'ดูดวง' }))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ topics: ['งาน', 'เงิน'] })
    )
  })

  it('prefills from initialValues', () => {
    render(
      <FortuneForm
        initialValues={{ ...emptyValues, fullName: 'สมหญิง ใจดี', birthDate: '1991-02-03' }}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByLabelText('ชื่อ-นามสกุล')).toHaveValue('สมหญิง ใจดี')
    expect(screen.getByLabelText('วันเดือนปีเกิด')).toHaveValue('1991-02-03')
  })
})