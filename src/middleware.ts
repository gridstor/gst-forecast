// Main middleware entry point for Astro
import { authMiddleware } from './middleware/auth';

export const onRequest = authMiddleware;
