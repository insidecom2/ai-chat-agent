import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CelestialInfoModal from '@/components/CelestialInfoModal';

function setup(props: Partial<React.ComponentProps<typeof CelestialInfoModal>> = {}) {
  return render(
    <CelestialInfoModal
      open={false}
      initialInfo={null}
      onSave={vi.fn()}
      onDismiss={vi.fn()}
      {...props}
    />
  );
}

describe('CelestialInfoModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    setup({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('prefills fields from initialInfo in edit mode', () => {
    setup({
      open: true,
      initialInfo: { fullName: 'สมชาย ใจดี', birthDate: '1990-01-01' },
    });
    expect(screen.getByLabelText('ชื่อ-นามสกุล')).toHaveValue('สมชาย ใจดี');
    expect(screen.getByLabelText('วันเดือนปีเกิด')).toHaveValue('1990-01-01');
  });

  it('shows error when submitting empty fields', async () => {
    const user = userEvent.setup();
    setup({ open: true });
    await user.click(screen.getByRole('button', { name: 'บันทึก' }));
    expect(screen.getByRole('alert')).toHaveTextContent('กรุณากรอก');
  });

  it('calls onSave with trimmed values', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    setup({ open: true, onSave });
    await user.type(screen.getByLabelText('ชื่อ-นามสกุล'), 'สมชาย ใจดี');
    await user.type(screen.getByLabelText('วันเดือนปีเกิด'), '1990-01-01');
    await user.click(screen.getByRole('button', { name: 'บันทึก' }));
    expect(onSave).toHaveBeenCalledWith({ fullName: 'สมชาย ใจดี', birthDate: '1990-01-01' });
  });

  it('calls onDismiss on close button', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    setup({ open: true, onDismiss });
    await user.click(screen.getByLabelText('ปิด'));
    expect(onDismiss).toHaveBeenCalled();
  });
});