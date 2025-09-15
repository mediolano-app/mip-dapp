import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/src/lib/config'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Sanitize/allowlist inbound headers
    const inbound = new Headers(request.headers)
    ;['cookie','authorization','host','connection','content-length','transfer-encoding','accept-encoding']
      .forEach(h => inbound.delete(h))
    const headers: HeadersInit = {
      ...Object.fromEntries(inbound.entries()),
      'Content-Type': 'application/json',
    }
    const response = await fetch(`${BACKEND_URL}/api/reports/${id}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: request.signal,
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: data.message || 'Backend request failed',
          error: data.error 
        }, 
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: response.status })

  } catch (error) {
    console.error('Report fetch error:', error)
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    // Sanitize/allowlist inbound headers
    const inbound = new Headers(request.headers)
    ;['cookie','authorization','host','connection','content-length','transfer-encoding','accept-encoding']
      .forEach(h => inbound.delete(h))
    const headers: HeadersInit = {
      ...Object.fromEntries(inbound.entries()),
      'Content-Type': 'application/json',
    }
    const response = await fetch(`${BACKEND_URL}/api/reports/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: request.signal,
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: data.message || 'Backend request failed',
          error: data.error 
        }, 
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: response.status })

  } catch (error) {
    console.error('Report update error:', error)
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
