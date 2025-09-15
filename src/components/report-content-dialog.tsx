"use client"

import * as React from "react"
import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { AlertTriangle, CheckCircle, Flag, X } from "lucide-react"
import { cn } from "@/src/lib/utils"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import { reportContentService } from "@/src/services/report.service"
import Image from "next/image"

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
}

const REPORT_TYPES = [
  {
    value: "inappropriate-content",
    label: "Inappropriate Content",
    description: "Content contains offensive, harmful, or explicit material"
  },
  {
    value: "copyright-infringement",
    label: "Copyright Infringement",
    description: "Content violates intellectual property rights"
  },
  {
    value: "spam",
    label: "Spam",
    description: "Content is repetitive, promotional, or off-topic"
  },
  {
    value: "harassment",
    label: "Harassment",
    description: "Content is abusive or targets specific individuals"
  },
  {
    value: "fake-content",
    label: "Fake or Misleading",
    description: "Content contains false information or impersonation"
  },
  {
    value: "scam",
    label: "Scam or Fraud",
    description: "Content appears to be fraudulent or deceptive"
  },
  {
    value: "other",
    label: "Other",
    description: "Report for other policy violations"
  }
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

  // Form state
  const [reportType, setReportType] = useState("")
  const [description, setDescription] = useState("")
  const [reportTypeError, setReportTypeError] = useState("")
  const [descriptionError, setDescriptionError] = useState("")

  const userWallet = user?.publicMetadata?.publicKey as string
  const userId = user?.id

  // Validation functions
  const validateReportType = (value: string): string => {
    if (!value || value.trim() === '') {
      return 'Please select a report type'
    }
    return ''
  }

  const validateDescription = (value: string): string => {
    if (!value || value.trim() === '') {
      return 'Please provide a description of the issue'
    }
    if (value.length < 10) {
      return 'Description must be at least 10 characters'
    }
    if (value.length > 1000) {
      return 'Description must not exceed 1000 characters'
    }
    return ''
  }

  // Handle form field changes
  const handleReportTypeChange = (value: string) => {
    setReportType(value)
    const error = validateReportType(value)
    setReportTypeError(error)
    if (error) setError("")
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setDescription(value)
    const error = validateDescription(value)
    setDescriptionError(error)
    if (error) setError("")
  }

  // Validate entire form
  const validateForm = (): boolean => {
    const typeError = validateReportType(reportType)
    const descError = validateDescription(description)
    
    setReportTypeError(typeError)
    setDescriptionError(descError)
    
    return !typeError && !descError
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setError("Please fix the errors above")
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
        description: description.trim(),
        contentType,
        contentId,
        contentTitle,
        contentOwner,
        reporterWallet: userWallet,
        reporterUserId: userId
      }

      await reportContentService.submitReport(reportData)
      
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
    setReportTypeError("")
    setDescriptionError("")
    setError("")
    setShowSuccess(false)
  }

  // Handle dialog open change
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  const isFormValid = reportType && description && !reportTypeError && !descriptionError && !isSubmitting

  const selectedReportType = REPORT_TYPES.find(type => type.value === reportType)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-fit" aria-describedby="report-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            Report Content
          </DialogTitle>
          <DialogDescription id="report-dialog-description">
            Report inappropriate or abusive content to help keep MIP safe for everyone.
          </DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          <div className="py-8">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-green-800">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="space-y-1">
                    <p className="font-medium">Report submitted successfully!</p>
                    <p className="text-sm text-green-700">
                      Thank you for helping keep MIP safe. Our moderation team will review this report.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Content Info */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Reporting content:</p>
                  <div className="flex gap-x-2">
                    {contentImage && (
                      <div className="w-20 h-20 rounded-sm overflow-hidden">
                        <Image
                          src={contentImage}
                          alt={contentTitle}
                          width={100}
                          height={100}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="text-sm">
                      <p className="font-semibold text-md">{contentTitle}</p>
                      <p className="capitalize text-muted-foreground">{contentType} ID: <span className="text-foreground font-medium">{contentId}</span></p>
                      {contentOwner && <p className="text-muted-foreground">Owner: <span className="text-foreground font-medium">{contentOwner}</span></p>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Report Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type *</Label>
              <Select value={reportType} onValueChange={handleReportTypeChange}>
                <SelectTrigger 
                  id="report-type"
                  className={cn(reportTypeError && "border-destructive")}
                  aria-describedby={reportTypeError ? "report-type-error" : undefined}
                >
                  <SelectValue placeholder="Select a reason for reporting" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {reportTypeError && (
                <p id="report-type-error" className="text-sm text-destructive">
                  {reportTypeError}
                </p>
              )}
              {selectedReportType && !reportTypeError && (
                <p className="text-sm ml-1 text-muted-foreground">
                  {selectedReportType.description}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description *
                <span className="text-xs text-muted-foreground ml-2">
                  ({description.length}/1000 characters)
                </span>
              </Label>
              <Textarea
                id="description"
                placeholder="Please provide specific details about why you're reporting this content. Include any relevant information that would help our moderation team."
                value={description}
                onChange={handleDescriptionChange}
                className={cn(
                  "min-h-[100px] resize-none",
                  descriptionError && "border-destructive"
                )}
                maxLength={1000}
                aria-describedby={descriptionError ? "description-error" : undefined}
              />
              {descriptionError && (
                <p id="description-error" className="text-sm text-destructive ml-1">
                  {descriptionError}
                </p>
              )}
            </div>

            {/* Warning */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">Please note:</p>
                    <ul className="mt-1 space-y-1 text-amber-700">
                      <li>• Reports are reviewed by the Mediolano DAO moderation team</li>
                      <li>• False reports may result in action against your account</li>
                      <li>• All reports are confidential</li>                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error message */}
            {error && (
              <Card className="border-destructive bg-destructive/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <X className="h-4 w-4" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <Flag className="h-4 w-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Export convenience component for quick integration
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
