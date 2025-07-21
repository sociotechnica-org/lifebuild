describe('Simple Test', () => {
  it('should work without imports', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle basic JavaScript features', () => {
    const obj = { key: 'value' }
    expect(obj).toHaveProperty('key', 'value')
  })
})
