import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Select } from './Select';

const OPTIONS = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
];

function setup(overrides = {}) {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<Select onChange={onChange} options={OPTIONS} value="" {...overrides} />);
  return { onChange, user };
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('Select rendering', () => {
  it('shows the label when provided', () => {
    setup({ label: 'Fruit' });
    expect(screen.getByText('Fruit')).toBeInTheDocument();
  });

  it('shows fallback text when no option matches the value', () => {
    setup({ value: '' });
    expect(screen.getByRole('button', { name: /select\.\.\./i })).toBeInTheDocument();
  });

  it('shows the selected option label', () => {
    setup({ value: 'banana' });
    expect(screen.getByRole('button').textContent).toContain('Banana');
  });

  it('renders a chevron icon by default (not loading)', () => {
    const { container } = render(<Select onChange={vi.fn()} options={OPTIONS} value="apple" />);
    // Spinner has a specific arc path; chevron has the down-chevron path
    expect(container.querySelector('path[d="m6 9 6 6 6-6"]')).not.toBeNull();
    expect(container.querySelector('path[d="M12 2C6.477 2 2 6.477 2 12"]')).toBeNull();
  });

  it('renders spinner icon when isLoading is true', () => {
    const { container } = render(
      <Select isLoading onChange={vi.fn()} options={OPTIONS} value="apple" />,
    );
    expect(container.querySelector('path[d="M12 2C6.477 2 2 6.477 2 12"]')).not.toBeNull();
    expect(container.querySelector('path[d="m6 9 6 6 6-6"]')).toBeNull();
  });

  it('shows error message when error prop is provided', () => {
    setup({ error: 'Required field' });
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('shows hint text when hint prop is provided', () => {
    setup({ hint: 'Choose a fruit' });
    expect(screen.getByText('Choose a fruit')).toBeInTheDocument();
  });
});

// ── Interaction ───────────────────────────────────────────────────────────────

describe('Select interaction', () => {
  it('opens the dropdown when trigger is clicked', async () => {
    const { user } = setup({ value: 'apple' });
    await user.click(screen.getByRole('button', { name: /apple/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('closes the dropdown after selecting an option', async () => {
    const { user } = setup({ value: 'apple' });
    await user.click(screen.getByRole('button', { name: /apple/i }));
    await user.click(screen.getByRole('option', { name: /banana/i }));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('calls onChange with the selected option value', async () => {
    const { user, onChange } = setup({ value: 'apple' });
    await user.click(screen.getByRole('button', { name: /apple/i }));
    await user.click(screen.getByRole('option', { name: /cherry/i }));
    expect(onChange).toHaveBeenCalledWith('cherry');
  });

  it('closes on Escape key', async () => {
    const { user } = setup({ value: 'apple' });
    await user.click(screen.getByRole('button', { name: /apple/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('does NOT open when isLoading is true', async () => {
    const { user } = setup({ isLoading: true, value: 'apple' });
    // The trigger button is disabled-by-design when loading: clicking it opens nothing
    const trigger = screen.getAllByRole('button')[0];
    await user.click(trigger);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('does NOT open when disabled', async () => {
    const { user } = setup({ disabled: true, value: 'apple' });
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('marks the currently selected option with aria-selected', async () => {
    const { user } = setup({ value: 'banana' });
    await user.click(screen.getByRole('button', { name: /banana/i }));
    const selected = screen.getByRole('option', { name: /banana/i });
    expect(selected).toHaveAttribute('aria-selected', 'true');
  });
});
