import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import ws from 'ws'

// Neon's serverless driver needs a WebSocket implementation in Node.
neonConfig.webSocketConstructor = ws

function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL no está configurada')
  }
  const adapter = new PrismaNeon({ connectionString })
  return new PrismaClient({ adapter })
}

// Inicialización perezosa: el servidor puede arrancar (y /health responder)
// aunque DATABASE_URL no esté presente; solo falla al tocar la DB.
let instance: PrismaClient | undefined

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!instance) {
      instance = createPrisma()
    }
    return Reflect.get(instance as object, prop, instance)
  },
})
