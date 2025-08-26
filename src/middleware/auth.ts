// Authentication middleware for GridStor Analytics
// Handles authentication exclusions for public sub-sites

import type { MiddlewareHandler } from 'astro';

export const authMiddleware: MiddlewareHandler = (context, next) => {
  const { url, request } = context;
  
  // Allow proxy requests from GridStor Analytics main site
  const userAgent = request.headers.get('User-Agent');
  const referer = request.headers.get('Referer');
  
  if (userAgent?.includes('GridStor-Analytics-Proxy') || 
      referer?.includes('gridstoranalytics.com') ||
      userAgent?.includes('Mozilla/5.0')) {
    // Allow requests from main site or browser requests
    return next();
  }
  
  // Public paths that don't require authentication
  const publicPaths = [
    '/dayzer',
    '/dayzer/',
    '/curve-viewer',
    '/curve-viewer/',
    '/',
  ];
  
  // Paths that start with these prefixes are public
  const publicPrefixes = [
    '/dayzer/',
    '/curve-viewer/',
    '/_astro/',
    '/assets/',
    '/api/',
  ];
  
  // Check if current path is public
  const isPublicPath = publicPaths.includes(url.pathname) || 
                      publicPrefixes.some(prefix => url.pathname.startsWith(prefix));
  
  if (isPublicPath) {
    // Skip authentication for public paths
    return next();
  }
  
  // For all other paths, authentication logic would go here
  // This is just a template - actual auth implementation depends on your setup
  return next();
};

export const onRequest = authMiddleware;
