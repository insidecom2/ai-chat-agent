import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import FortuneResult from '@/components/FortuneResult'

const values = {
  fullName: 'สมชาย ใจดี',
  birthDate: '1990-01-01',
  topics: [],
  extraText: '',
  tarotCards: ['ไพ่คนโง่', 'นักมายากล'],
}

describe('FortuneResult', () => {
  it('shows selected tarot card names while loading', () => {
    render(
      <FortuneResult
        values={values}
        streamText="กำลังวิเคราะห์"
        isLoading
        errorMessage={null}
        onEdit={vi.fn()}
        onNew={vi.fn()}
      />
    )

    expect(screen.getByText('ไพ่คนโง่, นักมายากล')).toBeInTheDocument()
    expect(screen.getByText('กำลังดูดวง…')).toBeInTheDocument()
  })

  it('shows the error state after the gateway fails', () => {
    render(
      <FortuneResult
        values={values}
        streamText=""
        isLoading={false}
        errorMessage="HTTP 502"
        onEdit={vi.fn()}
        onNew={vi.fn()}
      />
    )

    expect(screen.getByRole('alert')).toHaveTextContent('HTTP 502')
    expect(screen.getByText('ไพ่คนโง่, นักมายากล')).toBeInTheDocument()
  })
})
