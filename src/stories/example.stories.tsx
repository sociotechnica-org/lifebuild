import type { Meta, StoryObj } from '@storybook/react';
import { useQuery, useDispatch } from '@livestore/react';
import React from 'react';

// Example component for Storybook
function TodoList() {
  const todos = useQuery((db) => db.table('todos').all());
  const dispatch = useDispatch();
  const [newTodo, setNewTodo] = React.useState('');

  const addTodo = () => {
    if (newTodo.trim()) {
      dispatch({
        type: 'todo.add',
        id: crypto.randomUUID(),
        text: newTodo,
        completed: false,
        createdAt: Date.now(),
      });
      setNewTodo('');
    }
  };

  const toggleTodo = (id: string, completed: boolean) => {
    dispatch({
      type: 'todo.toggle',
      id,
      completed: !completed,
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <h2>Todo List (LiveStore)</h2>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a new todo..."
          style={{
            padding: '8px',
            width: '300px',
            marginRight: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
        <button
          onClick={addTodo}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Add
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {todos.map((todo) => (
          <li
            key={todo.id}
            style={{
              padding: '8px',
              marginBottom: '4px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              textDecoration: todo.completed ? 'line-through' : 'none',
              opacity: todo.completed ? 0.6 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id, todo.completed)}
              style={{ marginRight: '10px' }}
            />
            {todo.text}
          </li>
        ))}
      </ul>
      {todos.length === 0 && (
        <p style={{ color: '#666', fontStyle: 'italic' }}>No todos yet. Add one above!</p>
      )}
    </div>
  );
}

const meta = {
  title: 'LiveStore/TodoList',
  component: TodoList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TodoList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithInitialData: Story = {
  decorators: [
    (Story, context) => {
      const dispatch = useDispatch();
      
      React.useEffect(() => {
        // Add some initial todos
        const todos = [
          { id: '1', text: 'Learn Storybook', completed: true },
          { id: '2', text: 'Build with LiveStore', completed: false },
          { id: '3', text: 'Deploy to production', completed: false },
        ];
        
        todos.forEach(todo => {
          dispatch({
            type: 'todo.add',
            id: todo.id,
            text: todo.text,
            completed: todo.completed,
            createdAt: Date.now(),
          });
        });
      }, [dispatch]);
      
      return <Story />;
    },
  ],
};