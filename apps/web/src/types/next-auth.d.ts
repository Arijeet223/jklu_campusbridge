import { DefaultSession } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'STUDENT' | 'TEACHER' | 'FACULTY' | 'PLACEMENT_OFFICER' | 'OFFICER' | 'TPO' | 'ADMIN'
      department?: string
      institution_id?: string
      isVerifiedOfficer?: boolean
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: string
    department?: string
    institution_id?: string
    isVerifiedOfficer?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    department?: string
    institution_id?: string
    isVerifiedOfficer?: boolean
  }
}
