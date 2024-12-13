import type { APIRoute } from 'astro';
import prisma from '../../lib/prisma'

export const GET: APIRoute = async () => {
  try {
    await prisma.$connect();
    
    return new Response(JSON.stringify({
      status: 'success',
      message: 'Database connection successful'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: (error as Error).message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}