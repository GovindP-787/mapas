import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { verifyOperator } from "@/lib/operator-store"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const adminEmail = process.env.ADMIN_EMAIL ?? "admin@mapas.com"
        const adminPassword = process.env.ADMIN_PASSWORD ?? "mapas2024"

        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string"
        ) {
          return null
        }

        if (
          credentials.email === adminEmail &&
          credentials.password === adminPassword
        ) {
          return { id: "1", name: "Commander", email: adminEmail }
        }

        const operator = await verifyOperator(credentials.email, credentials.password)
        if (operator) {
          return operator
        }

        return null
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
})
