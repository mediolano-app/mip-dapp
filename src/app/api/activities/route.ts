'use server'

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '25'
    const offset = searchParams.get('offset') || '0'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const fromAddress = searchParams.get('from')

    // Determine the backend URL
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001'
    
    // Build the endpoint
    let endpoint = `${backendUrl}/transfers?limit=${limit}&offset=${offset}&sortOrder=${sortOrder}`
    if (fromAddress) {
      endpoint = `${backendUrl}/transfers/from/${fromAddress}?limit=${limit}&offset=${offset}&sortOrder=${sortOrder}`
    }

    console.log(`[API Route] Proxying request to: ${endpoint}`)

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`[API Route] Backend returned status ${response.status}`)
      return NextResponse.json(
        { 
          data: [],
          pagination: { total: 0, offset: 0, limit: parseInt(limit) },
          error: `Backend error: ${response.status}`
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API Route] Error fetching activities:', error)
    return NextResponse.json(
      { 
        data: [],
        pagination: { total: 0, offset: 0, limit: 25 },
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
