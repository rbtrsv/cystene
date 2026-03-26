import { NextResponse } from 'next/server';
import { db } from '@database/drizzle';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Simple database ping to keep connection alive
    const result = await db.execute(sql`SELECT 1 as ping`);
    
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      ping: result[0]?.ping 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Database ping failed' 
    }, { status: 500 });
  }
}