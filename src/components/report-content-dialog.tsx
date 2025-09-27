"use client"

import * as React from "react"
import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { AlertTriangle, CheckCircle, Flag, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent } from "@/src/components/ui/card"
import { Label } from "@/src/components/ui/label"
import { Textarea } from "@/src/components/ui/textarea"
import { Input } from "@/src/components/ui/input"
import { Checkbox } from "@/src/components/ui/checkbox"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import { reportContentService } from "@/src/services/report.service"
import { shortenAddress } from "@/src/lib/utils"

export interface ReportContentProps {
  contentType: "asset" | "collection" | "profile"
  contentId: string
  contentTitle: string
  contentOwner?: string
  contentImage?: string
  children: React.ReactNode
}

export interface ReportFormData {
  reportType: string
  description: string
  contentType: "asset" | "collection" | "profile"
  contentId: string
  contentTitle: string
  contentOwner?: string
  reporterWallet: string
  reporterUserId: string
  email?: string
}

const REPORT_REASONS = [
  { value: "copyright", label: "Copyright Infringement" },
  { value: "trademark", label: "Trademark Violation" },
  { value: "impersonation", label: "Impersonation" },
  { value: "fraud", label: "Fraudulent Content" },
  { value: "inappropriate", label: "Inappropriate Content" },
  { value: "spam", label: "Spam or Misleading" },
  { value: "other", label: "Other" },
]

export function ReportContentDialog({
  contentType,
  contentId,
  contentTitle,
  contentOwner,
  contentImage,
  children
}: ReportContentProps) {
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState("")
  const [reportId, setReportId] = useState<string | null>(null)

  // Form state
  const [reportType, setReportType] = useState("")
  const [description, setDescription] = useState("")
  const [email, setEmail] = useState("")
  const [agreeToPolicy, setAgreeToPolicy] = useState(false)

  const userWallet = user?.publicMetadata?.publicKey as string
  const userId = user?.id

  // Helper function to check if a string looks like an address
  const isAddress = (str: string): boolean => {
    if (!str || typeof str !== 'string') return false
    return /^0x[a-fA-F0-9]{40}$/.test(str) || /^0x[a-fA-F0-9]{64}$/.test(str) || /^[a-fA-F0-9]{64}$/.test(str)
  }

  // Helper function to format owner display
  const formatOwner = (owner: string): string => {
    if (!owner || typeof owner !== 'string') return owner
    if (isAddress(owner)) {
      return shortenAddress(owner, 6)
    }
    // Fallback: if it's a very long string, shorten it anyway
    if (owner.length > 20) {
      return `${owner.slice(0, 6)}...${owner.slice(-4)}`
    }
    return owner
  }

  // Handle form field changes
  const handleReportTypeChange = (value: string) => {
    setReportType(value)
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value)
  }

  const handleAgreeChange = (checked: boolean | string) => {
    setAgreeToPolicy(Boolean(checked))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedDescription = description.trim()
    
    if (!reportType || !trimmedDescription || !agreeToPolicy) {
      return
    }

    if (!userWallet || !userId) {
      setError("You must be logged in to submit a report")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const reportData: ReportFormData = {
        reportType: reportType,
        description: trimmedDescription,
        contentType,
        contentId,
        contentTitle,
        contentOwner,
        reporterWallet: userWallet,
        reporterUserId: userId,
        email: email || undefined,
      }

      const response = await reportContentService.submitReport(reportData)
      
      // Store the real report ID from the API response
      if (response.reportId) {
        setReportId(response.reportId)
      }
      
      // Show success state
      setShowSuccess(true)
      
      // Reset form after success
      setTimeout(() => {
        setShowSuccess(false)
        setOpen(false)
        resetForm()
      }, 3000)

    } catch (error) {
      console.error('Error submitting report:', error)
      setError(error instanceof Error ? error.message : 'Failed to submit report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form state
  const resetForm = () => {
    setReportType("")
    setDescription("")
    setEmail("")
    setAgreeToPolicy(false)
    setError("")
    setShowSuccess(false)
    setReportId(null)
  }

  // Handle dialog open change
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  const trimmedDescription = description.trim()
  const isFormValid = reportType && trimmedDescription && agreeToPolicy && !isSubmitting

  const selectedReportType = REPORT_REASONS.find(type => type.value === reportType)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="sm:w-[500px] sm:min-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            Report {contentType === "asset" ? "Asset" : contentType === "collection" ? "Collection" : "Content"}
          </DialogTitle>
          <DialogDescription>
            Report {contentType === "asset" ? "Asset" : contentType === "collection" ? "Collection" : "Content"} "{contentId.length > 10 ? `${contentId.slice(0, 6)}...${contentId.slice(-4)}` : contentId}"{contentOwner ? ` by ${formatOwner(contentOwner)}` : ""} for policy violations or legal issues.
          </DialogDescription>
        </DialogHeader>
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-green-700">Report Submitted Successfully</h3>
              <p className="text-sm text-muted-foreground">
                Thank you for helping keep Mediolano safe. We'll review your report and take appropriate action if
                necessary.
              </p>
              {reportId && (
                <p className="text-xs text-muted-foreground">
                  Report ID: {reportId}
                </p>
              )}
            </div>
          </div>
        ) : isSubmitting ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <div className="text-center">
              <h3 className="font-semibold">Submitting Report</h3>
              <p className="text-sm text-muted-foreground">Please wait while we process your report...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Report *</Label>
              <Select
                value={reportType}
                onValueChange={handleReportTypeChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description *</Label>
              <Textarea
                id="description"
                placeholder="Please provide specific details about the violation, including any evidence or supporting information..."
                value={description}
                onChange={handleDescriptionChange}
                className="min-h-[100px]"
                required
              />
            </div>

            {/* Warning */}
            <div className="space-y-2">
              <Label htmlFor="email">Contact Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We may contact you for additional information about your report.
              </p>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                False reports may result in account restrictions. Please ensure your report is accurate and made in good
                faith.
              </AlertDescription>
            </Alert>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="agree"
                checked={agreeToPolicy}
                onCheckedChange={handleAgreeChange}
                required
              />
              <Label htmlFor="agree" className="text-sm leading-5">
                I agree to the{" "}
                <a
                  href="/community-guidelines"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Community Guidelines
                </a>{" "}
                and confirm that this report is made in good faith. *
              </Label>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-md bg-red-50 p-2">
                  <div className="ml-3">
                    <div className="text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid}
                className="bg-red-600 hover:bg-red-700"
              >
                Submit Report
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function ReportButton(props: Omit<ReportContentProps, 'children'>) {
  return (
    <ReportContentDialog {...props}>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-destructive"
        aria-label="Report content"
      >
        <Flag className="h-4 w-4" />
      </Button>
    </ReportContentDialog>
  )
}
