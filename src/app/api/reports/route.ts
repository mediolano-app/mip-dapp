import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/src/lib/config'
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    
    // Sanitize/allowlist inbound headers
    const inbound = new Headers(request.headers)
    ;['cookie','authorization','host','connection','content-length','transfer-encoding','accept-encoding']
      .forEach(h => inbound.delete(h))
    const headers: HeadersInit = {
      ...Object.fromEntries(inbound.entries()),
      'Content-Type': 'application/json',
    }
    const response = await fetch(`${BACKEND_URL}/api/reports?${queryString}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: request.signal,
    })

    // Check for no-content statuses
    if (response.status === 204 || response.status === 205) {
      return new NextResponse(null, { status: response.status })
    }

    // Check if response has JSON content
    const contentType = response.headers.get('content-type')
    const isJson = contentType && contentType.includes('application/json')

    let data: any = null
    let errorMessage: string | null = null

    if (isJson) {
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError)
        errorMessage = 'Invalid JSON response from backend'
      }
    } else {
      // For non-JSON responses, read as text
      try {
        const textData = await response.text()
        if (textData) {
          data = { message: textData }
        }
      } catch (textError) {
        console.error('Text parsing error:', textError)
        errorMessage = 'Failed to read response body'
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: errorMessage || data?.message || 'Backend request failed',
          error: data?.error || (isJson ? null : data?.message)
        }, 
        { status: response.status }
      )
    }

    return NextResponse.json(data || {}, { status: response.status })

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
