import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/src/lib/config'

export async function GET(request: NextRequest) {
  try {
    // Sanitize/allowlist inbound headers
    const inbound = new Headers(request.headers)
    ;['cookie','authorization','host','connection','content-length','transfer-encoding','accept-encoding']
      .forEach(h => inbound.delete(h))
    const headers: HeadersInit = {
      ...Object.fromEntries(inbound.entries()),
      'Content-Type': 'application/json',
    }
    const response = await fetch(`${BACKEND_URL}/api/reports/health`, {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: request.signal,
    })

    // Check if response has content before parsing JSON
    const contentType = response.headers.get('content-type')
    const hasJsonContent = contentType && contentType.includes('application/json')
    
    let data = null
    if (hasJsonContent) {
      try {
        data = await response.json()
      } catch (parseError) {
        console.warn('Failed to parse JSON response:', parseError)
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: data?.message || 'Backend health check failed',
          error: data?.error 
        }, 
        { status: response.status }
      )
    }

    // For successful responses, return the data if available, otherwise return success
    return NextResponse.json(data || { success: true, status: 'healthy' }, { status: response.status })

  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
