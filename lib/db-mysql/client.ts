import mysql, { type Pool } from 'mysql2/promise'

export class MysqlConfigError extends Error {
  constructor(missing: string[]) {
    super(
      `Missing MySQL environment variables: ${missing.join(', ')}. Set them in .env.local.`
    )
    this.name = 'MysqlConfigError'
  }
}

let pool: Pool | null = null

export function getMysqlPool(): Pool {
  if (!pool) {
    pool = createPool()
  }
  return pool
}

function createPool(): Pool {
  const host = process.env.MYSQL_HOST
  const port = process.env.MYSQL_PORT
  const user = process.env.MYSQL_USER
  const password = process.env.MYSQL_PASSWORD
  const database = process.env.MYSQL_DATABASE

  const missing = [
    ['MYSQL_HOST', host],
    ['MYSQL_PORT', port],
    ['MYSQL_USER', user],
    ['MYSQL_PASSWORD', password],
    ['MYSQL_DATABASE', database],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name as string)

  if (missing.length > 0) {
    throw new MysqlConfigError(missing)
  }

  return mysql.createPool({
    host,
    port: Number(port),
    user,
    password,
    database,
    timezone: 'Z',
    waitForConnections: true,
    connectionLimit: 10,
  })
}
