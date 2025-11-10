import type { APIRoute } from 'astro';

/**
 * Proxy endpoint for shared-header.js to bypass CORS issues in local development
 * This fetches the script server-side and serves it with proper CORS headers
 * 
 * NOTE: The source file is currently password-protected (401), so this proxy will fail
 * until gst-homepage.netlify.app makes shared-header.js publicly accessible AND adds CORS headers.
 * 
 * Once both are fixed, this proxy can be removed and we can load the script directly from the source.
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const sourceUrl = 'https://gst-homepage.netlify.app/shared-header.js';
    
    console.log('Proxying shared-header.js from:', sourceUrl);
    
    // Fetch the script from the source
    const response = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GridStor-Proxy/1.0)',
      }
    });
    
    if (response.status === 401) {
      console.warn('shared-header.js is password-protected. The file needs to be made publicly accessible.');
      // Return a no-op script that logs a helpful message
      return new Response(
        `console.warn('Shared navigation header is currently unavailable. The file at ${sourceUrl} is password-protected and needs to be made publicly accessible with CORS headers.');`,
        {
          status: 200,
          headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
          }
        }
      );
    }
    
    if (!response.ok) {
      console.error('Failed to fetch shared-header.js:', response.status, response.statusText);
      throw new Error(`Failed to fetch shared-header.js: ${response.status} ${response.statusText}`);
    }
    
    const scriptContent = await response.text();
    
    console.log('Successfully proxied shared-header.js, length:', scriptContent.length);
    
    // Serve with CORS headers to allow loading from any origin
    return new Response(scriptContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      }
    });
    
  } catch (error) {
    console.error('Error proxying shared-header.js:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Return a no-op script that logs the error
    return new Response(
      `console.error('Failed to load shared-header.js:', ${JSON.stringify(errorMessage)});`,
      {
        status: 200, // Return 200 so the page doesn't show as broken
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        }
      }
    );
  }
};

