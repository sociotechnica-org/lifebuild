import { describe, expect, it } from 'vitest'
import { contactCreated, contactUpdated, contactDeleted } from '@lifebuild/shared/events'

describe('Contact Events', () => {
  describe('contactCreated', () => {
    it('should create a valid contact creation event', () => {
      const event = contactCreated({
        id: 'test-contact-id',
        name: 'John Doe',
        email: 'john.doe@example.com',
        createdAt: new Date('2023-01-01'),
      })

      expect(event.name).toBe('v1.ContactCreated')
      expect(event.args).toEqual({
        id: 'test-contact-id',
        name: 'John Doe',
        email: 'john.doe@example.com',
        createdAt: new Date('2023-01-01'),
      })
    })

    it('should handle optional email field', () => {
      const event = contactCreated({
        id: 'test-contact-id',
        name: 'John Doe',
        createdAt: new Date('2023-01-01'),
      })

      expect(event.name).toBe('v1.ContactCreated')
      expect(event.args).toEqual({
        id: 'test-contact-id',
        name: 'John Doe',
        createdAt: new Date('2023-01-01'),
      })
    })
  })

  describe('contactUpdated', () => {
    it('should create a valid contact update event', () => {
      const event = contactUpdated({
        id: 'test-contact-id',
        updates: {
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
        },
        updatedAt: new Date('2023-01-02'),
      })

      expect(event.name).toBe('v1.ContactUpdated')
      expect(event.args).toEqual({
        id: 'test-contact-id',
        updates: {
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
        },
        updatedAt: new Date('2023-01-02'),
      })
    })

    it('should handle partial updates - name only', () => {
      const event = contactUpdated({
        id: 'test-contact-id',
        updates: {
          name: 'Jane Smith',
        },
        updatedAt: new Date('2023-01-02'),
      })

      expect(event.name).toBe('v1.ContactUpdated')
      expect(event.args).toEqual({
        id: 'test-contact-id',
        updates: {
          name: 'Jane Smith',
        },
        updatedAt: new Date('2023-01-02'),
      })
    })

    it('should handle partial updates - email only', () => {
      const event = contactUpdated({
        id: 'test-contact-id',
        updates: {
          email: 'newemail@example.com',
        },
        updatedAt: new Date('2023-01-02'),
      })

      expect(event.name).toBe('v1.ContactUpdated')
      expect(event.args).toEqual({
        id: 'test-contact-id',
        updates: {
          email: 'newemail@example.com',
        },
        updatedAt: new Date('2023-01-02'),
      })
    })

    it('should handle clearing email with null', () => {
      const event = contactUpdated({
        id: 'test-contact-id',
        updates: {
          email: null,
        },
        updatedAt: new Date('2023-01-02'),
      })

      expect(event.name).toBe('v1.ContactUpdated')
      expect(event.args).toEqual({
        id: 'test-contact-id',
        updates: {
          email: null,
        },
        updatedAt: new Date('2023-01-02'),
      })
    })

    it('should handle empty updates', () => {
      const event = contactUpdated({
        id: 'test-contact-id',
        updates: {},
        updatedAt: new Date('2023-01-02'),
      })

      expect(event.name).toBe('v1.ContactUpdated')
      expect(event.args).toEqual({
        id: 'test-contact-id',
        updates: {},
        updatedAt: new Date('2023-01-02'),
      })
    })
  })

  describe('contactDeleted', () => {
    it('should create a valid contact deletion event', () => {
      const event = contactDeleted({
        id: 'test-contact-id',
        deletedAt: new Date('2023-01-03'),
      })

      expect(event.name).toBe('v1.ContactDeleted')
      expect(event.args).toEqual({
        id: 'test-contact-id',
        deletedAt: new Date('2023-01-03'),
      })
    })
  })
})
