import { PUBLIC_POCKETBASE_URL } from '$env/static/public'
import PocketBase from 'pocketbase'

export function createInstance() {
  return new PocketBase(PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090/')
}

export const pb = createInstance()
