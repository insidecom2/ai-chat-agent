import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import FortuneRedirectModal from '@/components/FortuneRedirectModal'

describe('FortuneRedirectModal', () => {
  it('shows the migration notice and destination link', () => {
    render(<FortuneRedirectModal />)

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('heading', { name: 'เว็บไซต์ดูดวงปรับโฉมใหม่' })).toBeInTheDocument()
    expect(screen.getByText(/jantraastro\.com/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'ไปที่เว็บไซต์ใหม่' })).toHaveAttribute(
      'href',
      'https://www.jantraastro.com/',
    )
  })

  it('does not provide a close control', () => {
    render(<FortuneRedirectModal />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
