import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: ['/', '/(en|rw|tr|zh|es|pt|ja|ko|id|ar|hi|vi|th|de|fr|it|ru|pl)/:path*'],
}
