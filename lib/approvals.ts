// lib/approvals.ts
type Approval = {
  approval_id: string
  urls: string[]
  meta?: Record<string, any>
  createdAt: number
  ttlMs: number
}

const g = globalThis as any
if (!g.__APPROVAL_STORE__) {
  g.__APPROVAL_STORE__ = new Map<string, Approval>()
}
const STORE: Map<string, Approval> = g.__APPROVAL_STORE__

export function saveApproval(a: { approval_id: string; urls: string[]; meta?: any; ttlSec?: number }) {
  const ttlMs = Math.max(60, a.ttlSec ?? 1800) * 1000 // default: 30 min
  const rec: Approval = {
    approval_id: a.approval_id,
    urls: a.urls,
    meta: a.meta || {},
    createdAt: Date.now(),
    ttlMs,
  }
  STORE.set(a.approval_id, rec)
  return rec
}

export function getApproval(id: string) {
  const rec = STORE.get(id)
  if (!rec) return null
  const expired = Date.now() - rec.createdAt > rec.ttlMs
  if (expired) {
    STORE.delete(id)
    return null
  }
  return rec
}

export function deleteApproval(id: string) {
  STORE.delete(id)
}
