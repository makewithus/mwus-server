import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    "/history(.*)",
    "/tokens(.*)",
    "/figma(.*)",
    "/export(.*)",
    "/api/save(.*)",   // ✅ REQUIRED
  ],
}