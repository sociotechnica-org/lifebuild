import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AddTaskForm } from './AddTaskForm.js'

describe('AddTaskForm', () => {
  it('should render input with placeholder', () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(<AddTaskForm onSubmit={onSubmit} onCancel={onCancel} />)

    expect(screen.getByPlaceholderText('Task name')).toBeInTheDocument()
  })

  it('should have disabled submit button when input is empty', () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(<AddTaskForm onSubmit={onSubmit} onCancel={onCancel} />)

    const submitButton = screen.getByText('Add Card')
    expect(submitButton).toBeDisabled()
  })

  it('should enable submit button when input has text', () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(<AddTaskForm onSubmit={onSubmit} onCancel={onCancel} />)

    const input = screen.getByPlaceholderText('Task name')
    fireEvent.change(input, { target: { value: 'New task' } })

    const submitButton = screen.getByText('Add Card')
    expect(submitButton).not.toBeDisabled()
  })

  it('should call onSubmit with trimmed text when form is submitted', () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(<AddTaskForm onSubmit={onSubmit} onCancel={onCancel} />)

    const input = screen.getByPlaceholderText('Task name')
    fireEvent.change(input, { target: { value: '  New task  ' } })
    fireEvent.click(screen.getByText('Add Card'))

    expect(onSubmit).toHaveBeenCalledWith('New task')
  })

  it('should call onSubmit when Enter is pressed in form', () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(<AddTaskForm onSubmit={onSubmit} onCancel={onCancel} />)

    const input = screen.getByPlaceholderText('Task name')
    fireEvent.change(input, { target: { value: 'New task' } })

    // Submit the form by pressing Enter
    const form = input.closest('form')!
    fireEvent.submit(form)

    expect(onSubmit).toHaveBeenCalledWith('New task')
  })

  it('should call onCancel when Escape is pressed', () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(<AddTaskForm onSubmit={onSubmit} onCancel={onCancel} />)

    const input = screen.getByPlaceholderText('Task name')
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(onCancel).toHaveBeenCalled()
  })

  it('should call onCancel when Cancel button is clicked', () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(<AddTaskForm onSubmit={onSubmit} onCancel={onCancel} />)

    fireEvent.click(screen.getByText('Cancel'))

    expect(onCancel).toHaveBeenCalled()
  })

  it('should clear input after successful submit', () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(<AddTaskForm onSubmit={onSubmit} onCancel={onCancel} />)

    const input = screen.getByPlaceholderText('Task name') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'New task' } })
    fireEvent.click(screen.getByText('Add Card'))

    expect(input.value).toBe('')
  })
})
