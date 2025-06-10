// Vitest provides describe, it, expect globally when globals: true is set in config
import React from 'react'
import { render, screen, fireEvent, createTestStore } from '../../src/test-utils'

// Example component for testing
function Counter() {
  const [count, setCount] = React.useState(0)

  return (
    <div>
      <p data-testid='count'>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}

describe('Counter Component', () => {
  it('should render initial count', () => {
    render(<Counter />)

    expect(screen.getByTestId('count')).toHaveTextContent('Count: 0')
  })

  it('should increment count on button click', () => {
    render(<Counter />)

    const button = screen.getByText('Increment')
    fireEvent.click(button)

    expect(screen.getByTestId('count')).toHaveTextContent('Count: 1')
  })
})

// Example test with mocked LiveStore (simplified for now)

function TodoCount() {
  // Mock component that doesn't actually use LiveStore for testing
  const todoCount = 0 // This would come from useQuery in real implementation

  return <div data-testid='todo-count'>Todos: {todoCount}</div>
}

describe('TodoCount Component (mocked)', () => {
  it('should show todo count', () => {
    render(<TodoCount />)

    expect(screen.getByTestId('todo-count')).toHaveTextContent('Todos: 0')
  })
})
