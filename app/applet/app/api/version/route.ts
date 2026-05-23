import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

// Generate a random build ID at server startup fallback
const fallbackBuildId = 'build_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

export async function GET() {
  let buildId = fallbackBuildId;
  try {
    // Read Next.js BUILD_ID if it exists (generated at build time)
    const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');
    if (fs.existsSync(buildIdPath)) {
      buildId = fs.readFileSync(buildIdPath, 'utf8').trim();
    }
  } catch (e) {
    console.error('Error reading BUILD_ID:', e);
  }

  // Prevent any caching of this response so clients always fetch the fresh version
  return new NextResponse(JSON.stringify({ version: buildId }), {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Content-Type': 'application/json',
    },
  });
}
