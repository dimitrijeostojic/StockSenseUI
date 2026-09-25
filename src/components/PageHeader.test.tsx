import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PageHeader } from './Layout';

vi.mock('../hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Products" />);
    expect(screen.getByText('Products')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<PageHeader title="Products" subtitle="42 items" />);
    expect(screen.getByText('42 items')).toBeInTheDocument();
  });

  it('renders tour button when onTourStart is provided', () => {
    render(<PageHeader title="Products" onTourStart={() => {}} />);
    expect(screen.getByRole('button', { name: /start page tour/i })).toBeInTheDocument();
  });

  it('does not render tour button when onTourStart is not provided', () => {
    render(<PageHeader title="Products" />);
    expect(screen.queryByRole('button', { name: /start page tour/i })).not.toBeInTheDocument();
  });

  it('calls onTourStart when tour button is clicked', () => {
    const onTourStart = vi.fn();
    render(<PageHeader title="Products" onTourStart={onTourStart} />);
    fireEvent.click(screen.getByRole('button', { name: /start page tour/i }));
    expect(onTourStart).toHaveBeenCalledOnce();
  });

  it('renders action slot', () => {
    render(<PageHeader title="Products" action={<button>Add</button>} />);
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });
});
