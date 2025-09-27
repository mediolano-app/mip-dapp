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

    // Instead of unconditionally parsing JSON, first read as text and
    // only JSON.parse if the content-type is JSON and the body is non-empty.
    const contentType = response.headers.get('content-type') ?? ''
    const rawBody = await response.text()
    const isJson = contentType.includes('application/json') && rawBody.length > 0
    const data = isJson ? JSON.parse(rawBody) : rawBody

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: isJson && typeof data === 'object' && data && 'message' in data
            ? (data as Record<string, unknown>).message
            : 'Backend request failed',
          error: isJson && typeof data === 'object' && data && 'error' in data
            ? (data as Record<string, unknown>).error
            : rawBody || null,
        },
        { status: response.status }
      )
    }

    // If it's JSON, preserve the object; otherwise return the raw text.
    if (isJson) {
      return NextResponse.json(data, { status: response.status })
    }
    return new NextResponse(rawBody, {
      status: response.status,
      headers: contentType ? { 'Content-Type': contentType } : undefined,
    })

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
    
    // Parse JSON with error handling
    let body: any
    try {
      body = await request.json()
    } catch (jsonError) {
      return NextResponse.json(
        { error: "Malformed JSON" },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
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
