import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/src/lib/config'

// Helper function to safely parse response
async function parseResponse(response: Response) {
  // Handle 204 No Content responses
  if (response.status === 204) {
    return { success: true, message: 'Success' }
  }

  // Check content-type for JSON responses
  const contentType = response.headers.get('content-type')
  const isJson = contentType && contentType.includes('application/json')

  if (!isJson) {
    try {
      const text = await response.text()
      return {
        success: false,
        message: 'Non-JSON response',
        raw: text
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to parse non-JSON response',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Parse JSON response with error handling
  try {
    return await response.json()
  } catch (error) {
    return {
      success: false,
      message: 'Failed to parse JSON response',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Sanitize/allowlist inbound headers
    const inbound = new Headers(request.headers)
    ;['cookie','authorization','host','connection','content-length','transfer-encoding','accept-encoding']
      .forEach(h => inbound.delete(h))
    const headers: HeadersInit = {
      ...Object.fromEntries(inbound.entries()),
      'Content-Type': 'application/json',
      'X-Report-Source': 'mip-dapp',
      'X-Report-Version': '1.0',
    }
    const response = await fetch(`${BACKEND_URL}/api/reports/submit`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: request.signal,
    })

    // Handle 204 No Content responses immediately
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await parseResponse(response)

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
    const errorId = crypto.randomUUID()
    console.error(`Report submission error [${errorId}]:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorId
    })
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        errorId
      }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    
    const inbound = new Headers(request.headers)
    ;['cookie','authorization','host','connection','content-length','transfer-encoding','accept-encoding']
      .forEach(h => inbound.delete(h))
    const headers: HeadersInit = Object.fromEntries(inbound.entries())
    const backendUrl = new URL(`${BACKEND_URL}/api/reports?${queryString}`)
    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: request.signal,
    })

    // Handle 204 No Content responses immediately
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await parseResponse(response)

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
    const errorId = crypto.randomUUID()
    console.error(`Report fetch error [${errorId}]:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorId
    })
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        errorId
      }, 
      { status: 500 }
    )
  }
}
