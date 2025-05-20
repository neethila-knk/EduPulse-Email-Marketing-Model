import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import Alert from '../Alert';

describe('Alert Component', () => {
  const handleConfirm = vi.fn();
  const handleCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default title and buttons', () => {
    render(<Alert message="Are you sure?" onConfirm={handleConfirm} />);

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm is clicked', () => {
    render(<Alert message="Sure?" onConfirm={handleConfirm} />);
    fireEvent.click(screen.getByText('Yes'));
    expect(handleConfirm).toHaveBeenCalled();
  });

  it('calls onCancel when cancel is clicked', () => {
    render(
      <Alert message="Sure?" onConfirm={handleConfirm} onCancel={handleCancel} />
    );
    fireEvent.click(screen.getByText('No'));
    expect(handleCancel).toHaveBeenCalled();
  });

  it('does not render cancel button when showCancelButton is false', () => {
    render(
      <Alert
        message="No cancel"
        onConfirm={handleConfirm}
        showCancelButton={false}
      />
    );
    expect(screen.queryByText('No')).not.toBeInTheDocument();
  });

  it('renders with custom title and button text', () => {
    render(
      <Alert
        title="Alert Title"
        message="Something important"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Confirm"
        cancelText="Dismiss"
      />
    );
    expect(screen.getByText('Alert Title')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
  });
});
