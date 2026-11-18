import { DefaultSession } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'STUDENT' | 'FACULTY'
      department?: string
      institution_id?: string
      isVerifiedOfficer?: boolean
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: 'STUDENT' | 'FACULTY'
    department?: string
    institution_id?: string
    isVerifiedOfficer?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: 'STUDENT' | 'FACULTY'
    department?: string
    institution_id?: string
    isVerifiedOfficer?: boolean
  }
}

