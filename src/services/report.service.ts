import { ReportFormData } from "@/src/components/report-content-dialog"
import { getApiBaseUrl } from "@/src/lib/config"

export interface ReportSubmissionResponse {
  success: boolean
  reportId?: string
  message: string
  timestamp: string
}

export interface ReportMetadata {
  reportId: string
  reportType: string
  contentType: "asset" | "collection" | "profile"
  contentId: string
  contentTitle: string
  contentOwner?: string
  reporterWallet: string
  reporterUserId: string
  description: string
  timestamp: string
  status: "pending" | "under_review" | "resolved" | "dismissed"
  blockchainTxHash?: string
}

/**
 * Service for handling content reporting functionality
 * Routes reports to Mediolano DAO for moderation
 */
export class ReportContentService {
  private baseUrl: string
  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAY_MS = 1000

  constructor() {
    // Use the configured API base URL for direct backend access
    this.baseUrl = getApiBaseUrl()
  }

  /**
   * Submit a content report to the Mediolano DAO
   */
  async submitReport(reportData: ReportFormData): Promise<ReportSubmissionResponse> {
    let attempt = 0
    
    while (attempt < this.MAX_RETRIES) {
      try {
        const reportId = this.generateReportId()
        const timestamp = new Date().toISOString()
        
        const payload = {
          reportId,
          ...reportData,
          timestamp,
          status: "pending",
          source: "mip-dapp",
          version: "1.0"
        }

        

        const response = await fetch(`${this.baseUrl}/api/reports/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Report-Source': 'mip-dapp',
            'X-Report-Version': '1.0'
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30000) // 30 second timeout
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.message || 
            `Report submission failed: ${response.status} ${response.statusText}`
          )
        }

        const result = await response.json()

        return {
          success: true,
          reportId: result.reportId || reportId,
          message: result.message || "Report submitted successfully to Mediolano DAO",
          timestamp
        }

      } catch (error) {
        attempt++
        console.error(`Report submission attempt ${attempt} failed:`, error)
        
        if (attempt >= this.MAX_RETRIES) {
          throw new Error(
            "Unable to submit report at this time. Please try again later or contact support."
          )
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS * attempt))
      }
    }

    throw new Error("Unexpected error in report submission")
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    const timestamp = Date.now().toString(36)
    const randomPart = Math.random().toString(36).substring(2, 8)
    return `report_${timestamp}_${randomPart}`
  }

  /**
   * Validate and sanitize reportId to prevent injection attacks
   * Enforces strict pattern: alphanumeric characters, underscores, and hyphens only
   */
  private validateAndSanitizeReportId(reportId: string): string {
    if (!reportId || typeof reportId !== 'string') {
      throw new Error('Invalid reportId: must be a non-empty string')
    }

    // Allow alphanumeric characters, underscores, and hyphens only
    // This matches the pattern used by generateReportId: report_timestamp_random
    const validPattern = /^[a-zA-Z0-9_-]+$/
    
    if (!validPattern.test(reportId)) {
      throw new Error(`Invalid reportId format: '${reportId}' contains invalid characters. Only alphanumeric characters, underscores, and hyphens are allowed.`)
    }

    // Additional length check to prevent extremely long IDs
    if (reportId.length > 100) {
      throw new Error(`Invalid reportId: length exceeds maximum of 100 characters`)
    }

    // Return the validated reportId (no encoding needed since we've validated the pattern)
    return reportId
  }

  /**
   * Get user's report history (from backend)
   */
  async getUserReportHistory(userWallet: string): Promise<ReportMetadata[]> {
    if (!userWallet || typeof userWallet !== 'string') {
      throw new Error('Invalid userWallet: must be a non-empty string')
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/reports?reporterWallet=${encodeURIComponent(userWallet)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Report-Source': 'mip-dapp'
        },
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch report history: ${response.status}`)
      }

      const data = await response.json()
      return Array.isArray(data.reports) ? data.reports : []

    } catch (error) {
      console.error('Error getting user report history:', error)
      throw (error instanceof Error ? error : new Error('Failed to fetch report history'))
    }
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId: string): Promise<ReportMetadata | null> {
    // Validate and sanitize reportId to prevent injection attacks
    const validatedReportId = this.validateAndSanitizeReportId(reportId)
    
    const response = await fetch(`${this.baseUrl}/api/reports/${validatedReportId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Report-Source': 'mip-dapp'
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch report: ${response.status}`)
    }

    const data = await response.json()
    return data.report || null
  }

  /**
   * Check if reports service is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/reports/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })

      return response.ok
    } catch (error) {
      console.error('Reports service health check failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const reportContentService = new ReportContentService()