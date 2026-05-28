/// <reference types="@cloudflare/workers-types" />
import { expect, test, describe } from 'vitest'
import { ReviewAggregator } from './ReviewAggregator'

class FakeStorage {
  map = new Map<string, any>()
  async get<T>(key: string): Promise<T | undefined> {
    return this.map.get(key) as T | undefined
  }
  async put(key: string, value: any): Promise<void> {
    this.map.set(key, value)
  }
}

function makeAggregator() {
  const storage = new FakeStorage() as unknown as DurableObjectState['storage']
  const state = { storage } as DurableObjectState
  const db = {
    prepare: (sql: string) => ({
      bind: (..._args: any[]) => ({
        run: async () => ({}),
        first: async <T>() => ({ reporterId: 'u1' } as T),
      }),
    }),
  } as unknown as D1Database
  const env = { DB: db }
  return new ReviewAggregator(state, env)
}

describe('ReviewAggregator score calculation', () => {
  test('weighted score after 3 upvotes of weight 1 becomes 1.0', async () => {
    const ag = makeAggregator()
    const resp1 = await ag.fetch(new Request('http://do/', {
      method: 'POST',
      body: JSON.stringify({ reportId: 'r1', vote: 'UP', weight: 1 }),
    }))
    const data1 = await resp1.json() as any
    expect(data1.score).toBe(1)

    const resp2 = await ag.fetch(new Request('http://do/', {
      method: 'POST',
      body: JSON.stringify({ reportId: 'r1', vote: 'UP', weight: 1 }),
    }))
    const data2 = await resp2.json() as any
    expect(data2.score).toBe(1)

    const resp3 = await ag.fetch(new Request('http://do/', {
      method: 'POST',
      body: JSON.stringify({ reportId: 'r1', vote: 'UP', weight: 1 }),
    }))
    const data3 = await resp3.json() as any
    expect(data3.score).toBe(1)
    expect(data3.status).toBe('VERIFIED')
  })

  test('mixed votes produce correct weighted average', async () => {
    const ag = makeAggregator()
    await ag.fetch(new Request('http://do/', {
      method: 'POST',
      body: JSON.stringify({ reportId: 'r2', vote: 'UP', weight: 2 }),
    }))
    await ag.fetch(new Request('http://do/', {
      method: 'POST',
      body: JSON.stringify({ reportId: 'r2', vote: 'DOWN', weight: 1 }),
    }))
    const resp = await ag.fetch(new Request('http://do/', {
      method: 'POST',
      body: JSON.stringify({ reportId: 'r2', vote: 'UP', weight: 3 }),
    }))
    const data = await resp.json() as any
    const totalWeight = 2 + 1 + 3
    const weightedSum = 2 + (-1) + 3
    expect(data.score).toBeCloseTo(weightedSum / totalWeight, 5)
    expect(data.status).toBe('VERIFIED')
  })
})
