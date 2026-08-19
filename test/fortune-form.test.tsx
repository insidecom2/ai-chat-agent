import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FortuneForm, { type FortuneFormValues } from '@/components/FortuneForm'
import { TAROT_DECK } from '@/lib/tarot'

const emptyValues: FortuneFormValues = {
  fullName: '',
  birthDate: '',
  topics: [],
  extraText: '',
  tarotCards: [],
}

const selectTenCards = async (user: ReturnType<typeof userEvent.setup>) => {
  const tarotToggle = screen.getByLabelText('ดูไพ่ทาโรต์')
  if (!(tarotToggle as HTMLInputElement).checked) await user.click(tarotToggle)
  for (let cardIndex = 1; cardIndex <= 10; cardIndex += 1) {
    await user.click(screen.getByRole('button', { name: `ไพ่ใบที่ ${cardIndex}` }))
  }
}

describe('FortuneForm', () => {
  it('shows an error when name and birth date are empty', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<FortuneForm initialValues={emptyValues} tarotDeck={TAROT_DECK.cards} onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: 'ดูดวง' }))
    expect(screen.getByRole('alert')).toHaveTextContent('กรุณากรอก')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits trimmed values when name and birth date are filled', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<FortuneForm initialValues={emptyValues} tarotDeck={TAROT_DECK.cards} onSubmit={onSubmit} />)
    await user.type(screen.getByLabelText('ชื่อ-นามสกุล'), 'สมชาย ใจดี')
    await user.type(screen.getByLabelText('วันเดือนปีเกิด'), '1990-01-01')
    await selectTenCards(user)
    await user.click(screen.getByRole('button', { name: 'ดูดวง' }))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'สมชาย ใจดี',
        birthDate: '1990-01-01',
        topics: [],
        extraText: '',
      })
    )
    expect(onSubmit.mock.calls[0][0].tarotCards).toHaveLength(10)
  })

  it('toggles topics and passes them to onSubmit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<FortuneForm initialValues={emptyValues} tarotDeck={TAROT_DECK.cards} onSubmit={onSubmit} />)
    await user.type(screen.getByLabelText('ชื่อ-นามสกุล'), 'สมชาย ใจดี')
    await user.type(screen.getByLabelText('วันเดือนปีเกิด'), '1990-01-01')
    await user.click(screen.getByLabelText('งาน'))
    await user.click(screen.getByLabelText('เงิน'))
    await selectTenCards(user)
    await user.click(screen.getByRole('button', { name: 'ดูดวง' }))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ topics: ['งาน', 'เงิน'] })
    )
  })

  it('prefills from initialValues', () => {
    render(
      <FortuneForm
        initialValues={{ ...emptyValues, fullName: 'สมหญิง ใจดี', birthDate: '1991-02-03' }}
        tarotDeck={TAROT_DECK.cards}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByLabelText('ชื่อ-นามสกุล')).toHaveValue('สมหญิง ใจดี')
    expect(screen.getByLabelText('วันเดือนปีเกิด')).toHaveValue('1991-02-03')
  })

  it('requires exactly ten tarot cards', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<FortuneForm initialValues={emptyValues} tarotDeck={TAROT_DECK.cards} onSubmit={onSubmit} />)
    await user.type(screen.getByLabelText('ชื่อ-นามสกุล'), 'สมชาย ใจดี')
    await user.type(screen.getByLabelText('วันเดือนปีเกิด'), '1990-01-01')
    await user.click(screen.getByLabelText('ดูไพ่ทาโรต์'))
    await user.click(screen.getByRole('button', { name: 'ไพ่ใบที่ 1' }))
    await user.click(screen.getByRole('button', { name: 'ดูดวง' }))
    expect(screen.getByRole('alert')).toHaveTextContent('ครบ 10 ใบ')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows all 78 unique tarot cards and prevents an eleventh selection', async () => {
    const user = userEvent.setup()
    render(<FortuneForm initialValues={emptyValues} tarotDeck={TAROT_DECK.cards} onSubmit={vi.fn()} />)
    await user.click(screen.getByLabelText('ดูไพ่ทาโรต์'))
    expect(screen.getAllByRole('button', { name: /^ไพ่ใบที่/ })).toHaveLength(78)
    await selectTenCards(user)
    expect(screen.getByText('เลือกไพ่ทาโรต์ (10/10)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ไพ่ใบที่ 11' })).toBeDisabled()
  })

  it('can reset the selected tarot cards and shuffle a new deck', async () => {
    const user = userEvent.setup()
    render(<FortuneForm initialValues={emptyValues} tarotDeck={TAROT_DECK.cards} onSubmit={vi.fn()} />)
    await user.click(screen.getByLabelText('ดูไพ่ทาโรต์'))
    await user.click(screen.getByRole('button', { name: 'ไพ่ใบที่ 1' }))
    expect(screen.getByText('เลือกไพ่ทาโรต์ (1/10)')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'สุ่มไพ่ใหม่' }))
    expect(screen.getByText('เลือกไพ่ทาโรต์ (0/10)')).toBeInTheDocument()
  })

  it('submits without tarot cards when tarot reading is disabled', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<FortuneForm initialValues={emptyValues} tarotDeck={TAROT_DECK.cards} onSubmit={onSubmit} />)
    await user.type(screen.getByLabelText('ชื่อ-นามสกุล'), 'สมชาย ใจดี')
    await user.type(screen.getByLabelText('วันเดือนปีเกิด'), '1990-01-01')
    await user.click(screen.getByRole('button', { name: 'ดูดวง' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ tarotCards: [] }))
  })
})
