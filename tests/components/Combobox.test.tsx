import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Combobox } from '../../src/components/ui/Combobox'

const mockOptions = [
  { id: 'user-1', label: 'Alice Johnson' },
  { id: 'user-2', label: 'Bob Smith' },
  { id: 'user-3', label: 'Carol Davis' },
]

describe('Combobox', () => {
  it('renders with placeholder text when no options selected', () => {
    const mockOnChange = vi.fn()
    render(
      <Combobox
        options={mockOptions}
        selectedIds={[]}
        onSelectionChange={mockOnChange}
        placeholder='Select users...'
      />
    )

    expect(screen.getByText('Select users...')).toBeInTheDocument()
  })

  it('displays selected options as chips', () => {
    const mockOnChange = vi.fn()
    render(
      <Combobox
        options={mockOptions}
        selectedIds={['user-1', 'user-2']}
        onSelectionChange={mockOnChange}
      />
    )

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    expect(screen.getByText('Bob Smith')).toBeInTheDocument()
  })

  it('opens dropdown when clicked', () => {
    const mockOnChange = vi.fn()
    render(<Combobox options={mockOptions} selectedIds={[]} onSelectionChange={mockOnChange} />)

    fireEvent.click(screen.getByRole('button'))

    // All options should be visible
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    expect(screen.getByText('Bob Smith')).toBeInTheDocument()
    expect(screen.getByText('Carol Davis')).toBeInTheDocument()
  })

  it('toggles selection when option is clicked', () => {
    const mockOnChange = vi.fn()
    render(
      <Combobox options={mockOptions} selectedIds={['user-1']} onSelectionChange={mockOnChange} />
    )

    // Open dropdown
    fireEvent.click(screen.getByRole('button'))

    // Click on unselected option (in the dropdown)
    const dropdownOptions = screen.getAllByRole('option')
    const bobOption = dropdownOptions.find(option => option.textContent?.includes('Bob Smith'))
    fireEvent.click(bobOption!)

    expect(mockOnChange).toHaveBeenCalledWith(['user-1', 'user-2'])
  })

  it('shows checkmark for selected options in dropdown', () => {
    const mockOnChange = vi.fn()
    render(
      <Combobox options={mockOptions} selectedIds={['user-1']} onSelectionChange={mockOnChange} />
    )

    // Open dropdown
    fireEvent.click(screen.getByRole('button'))

    // First option should have selected styling
    const firstOption = screen.getAllByRole('option')[0]
    expect(firstOption).toHaveClass('bg-blue-50', 'text-blue-900')
  })

  it('closes dropdown when escape key is pressed', () => {
    const mockOnChange = vi.fn()
    render(<Combobox options={mockOptions} selectedIds={[]} onSelectionChange={mockOnChange} />)

    // Open dropdown
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    // Press escape
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Escape' })

    // Dropdown should be closed
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
