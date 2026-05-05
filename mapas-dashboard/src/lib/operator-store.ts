import { mkdir, readFile, writeFile } from "node:fs/promises"
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import path from "node:path"
import { promisify } from "node:util"

const scrypt = promisify(scryptCallback)

const DATA_DIR = path.join(process.cwd(), "data")
const STORE_PATH = path.join(DATA_DIR, "operators.json")

type StoredOperator = {
  id: string
  name: string
  email: string
  passwordHash: string
  salt: string
  createdAt: string
}

type PublicOperator = {
  id: string
  name: string
  email: string
}

function getClearanceCode(): string {
  return process.env.OPERATOR_CLEARANCE_CODE ?? process.env.ADMIN_PASSWORD ?? "mapas2024"
}

async function ensureStore(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  try {
    await readFile(STORE_PATH, "utf-8")
  } catch {
    await writeFile(STORE_PATH, JSON.stringify([], null, 2), "utf-8")
  }
}

async function readOperators(): Promise<StoredOperator[]> {
  await ensureStore()
  const content = await readFile(STORE_PATH, "utf-8")
  const parsed = JSON.parse(content)
  return Array.isArray(parsed) ? (parsed as StoredOperator[]) : []
}

async function writeOperators(operators: StoredOperator[]): Promise<void> {
  await writeFile(STORE_PATH, JSON.stringify(operators, null, 2), "utf-8")
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const derived = (await scrypt(password, salt, 64)) as Buffer
  return derived.toString("hex")
}

export async function registerOperator(params: {
  name: string
  email: string
  password: string
  clearanceCode: string
}): Promise<PublicOperator> {
  const clearance = getClearanceCode()
  if (params.clearanceCode !== clearance) {
    throw new Error("INVALID_CLEARANCE")
  }

  const email = params.email.trim().toLowerCase()
  const operators = await readOperators()
  const exists = operators.some((operator) => operator.email.toLowerCase() === email)
  if (exists) {
    throw new Error("EMAIL_EXISTS")
  }

  const salt = randomBytes(16).toString("hex")
  const passwordHash = await hashPassword(params.password, salt)
  const operator: StoredOperator = {
    id: randomBytes(8).toString("hex"),
    name: params.name.trim(),
    email,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  }

  operators.push(operator)
  await writeOperators(operators)

  return {
    id: operator.id,
    name: operator.name,
    email: operator.email,
  }
}

export async function verifyOperator(email: string, password: string): Promise<PublicOperator | null> {
  const operators = await readOperators()
  const normalized = email.trim().toLowerCase()
  const operator = operators.find((entry) => entry.email.toLowerCase() === normalized)
  if (!operator) {
    return null
  }

  const computedHash = await hashPassword(password, operator.salt)
  const isValid = timingSafeEqual(
    Buffer.from(computedHash, "hex"),
    Buffer.from(operator.passwordHash, "hex")
  )

  if (!isValid) {
    return null
  }

  return {
    id: operator.id,
    name: operator.name,
    email: operator.email,
  }
}

export async function recoverOperatorPassword(params: {
  email: string
  newPassword: string
  clearanceCode: string
}): Promise<PublicOperator> {
  const clearance = getClearanceCode()
  if (params.clearanceCode !== clearance) {
    throw new Error("INVALID_CLEARANCE")
  }

  const email = params.email.trim().toLowerCase()
  const operators = await readOperators()
  const index = operators.findIndex((operator) => operator.email.toLowerCase() === email)

  if (index < 0) {
    throw new Error("ACCOUNT_NOT_FOUND")
  }

  const salt = randomBytes(16).toString("hex")
  const passwordHash = await hashPassword(params.newPassword, salt)

  operators[index] = {
    ...operators[index],
    passwordHash,
    salt,
  }

  await writeOperators(operators)

  return {
    id: operators[index].id,
    name: operators[index].name,
    email: operators[index].email,
  }
}
