"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Textarea } from "@/src/components/ui/textarea"
import { Checkbox } from "@/src/components/ui/checkbox"
import { Separator } from "@/src/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog"
import { PinInput } from "@/src/components/pin-input"
import {
  Send,
  Wallet,
  User,
  Zap,
  Shield,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Clock,
  ArrowRight,
  X,
  Plus,
  Minus,
} from "lucide-react"
import Image from "next/image"
import { toast } from "@/src/hooks/use-toast"
import { useTransfer, type TransferAsset } from "@/src/hooks/use-transfer-simulation";
import { useTransferHistory } from "@/src/hooks/use-transfer-history";

interface TransferAssetModalProps {
  trigger?: React.ReactNode
  preselectedAssets?: TransferAsset[]
  availableAssets: TransferAsset[]
  onTransferComplete?: (txHash: string) => void
}

export function TransferAssetModal({
  trigger,
  preselectedAssets = [],
  availableAssets,
  onTransferComplete,
}: TransferAssetModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAssets, setSelectedAssets] = useState<TransferAsset[]>(preselectedAssets)
  const [recipientAddress, setRecipientAddress] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [transferNote, setTransferNote] = useState("")
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")
  const [estimatedFee, setEstimatedFee] = useState("0.000")
  const [txHash, setTxHash] = useState("")
  const [transferComplete, setTransferComplete] = useState(false)
  const [addressValidation, setAddressValidation] = useState<"" | "valid" | "invalid">("")

  const {
    transferAssets,
    isTransferring,
    estimateGasFee,
    isEstimating,
    validateRecipientAddress,
  } = useTransfer()

  const {
    recentAddresses,
    addToHistory,
  } = useTransferHistory()

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedAssets(preselectedAssets)
      setRecipientAddress("")
      setRecipientName("")
      setTransferNote("")
      setPin("")
      setPinError("")
      setTxHash("")
      setTransferComplete(false)
      setShowPinDialog(false)
      setAddressValidation("")
    }
  }, [isOpen, preselectedAssets])

  // Validate recipient address
  useEffect(() => {
    if (!recipientAddress) {
      setAddressValidation("")
      return
    }
    
    const isValid = validateRecipientAddress(recipientAddress)
    setAddressValidation(isValid ? "valid" : "invalid")
  }, [recipientAddress, validateRecipientAddress])

  // Estimate gas fees when assets or recipient changes
  useEffect(() => {
    const estimateFees = async () => {
      if (selectedAssets.length > 0 && recipientAddress && addressValidation === "valid") {
        try {
          const fee = await estimateGasFee(selectedAssets, recipientAddress)
          setEstimatedFee(fee)
        } catch (error) {
          console.error('Fee estimation failed:', error)
          setEstimatedFee("0.002") // Fallback
        }
      }
    }

    estimateFees()
  }, [selectedAssets, recipientAddress, addressValidation, estimateGasFee])

  const handleAssetToggle = (asset: TransferAsset) => {
    setSelectedAssets((prev: TransferAsset[]) => {
      const isSelected = prev.some((a: TransferAsset) => a.id === asset.id)
      if (isSelected) {
        return prev.filter((a: TransferAsset) => a.id !== asset.id)
      } else {
        return [...prev, asset]
      }
    })
  }

  const handleSelectAll = () => {
    setSelectedAssets(availableAssets)
  }

  const handleDeselectAll = () => {
    setSelectedAssets([])
  }

  const handlePinSubmit = async (submittedPin: string) => {
    if (!submittedPin || submittedPin.length !== 6) {
      setPinError("Please enter a valid 6-digit PIN")
      return
    }

    setPinError("")
    
    try {
      const result = await transferAssets(selectedAssets, recipientAddress, submittedPin)
      
      if (result.success && result.txHash) {
        setTxHash(result.txHash)
        setTransferComplete(true)
        setShowPinDialog(false)
        // Add to transfer history
        addToHistory(recipientAddress, recipientName)
        onTransferComplete?.(result.txHash)
      } else {
        setPinError(result.error || "Transfer failed")
      }
    } catch (error) {
      setPinError("Transfer failed. Please try again.")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    })
  }

  const canProceed = selectedAssets.length > 0 && addressValidation === "valid"

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Send className="w-4 h-4 mr-2" />
            Transfer Assets
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Send className="w-5 h-5 text-primary" />
            <span>Transfer IP Assets</span>
          </DialogTitle>
          <DialogDescription>
            Transfer ownership of your tokenized IP assets through the Mediolano Protocol
          </DialogDescription>
        </DialogHeader>

        {transferComplete ? (
          // Transfer Success View
          <div className="space-y-6">
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Transfer Successful!</h3>
              <p className="text-muted-foreground">
                Successfully transferred {selectedAssets.length} asset(s) to{" "}
                {recipientName || `${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`}
              </p>
            </div>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Transaction Hash</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(txHash)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="font-mono text-xs bg-background/50 p-2 rounded break-all">
                  {txHash}
                </div>
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span className="text-muted-foreground">Gas Fee</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    <Zap className="w-3 h-3 mr-1" />
                    {estimatedFee} ETH (Covered by Paymaster)
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => window.open(`https://starkscan.co/tx/${txHash}`, '_blank')}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Explorer
              </Button>
              <Button onClick={() => setIsOpen(false)} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        ) : (
          // Transfer Form
          <div className="space-y-6">
            {/* Asset Selection */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    <span>Select Assets</span>
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      disabled={selectedAssets.length === availableAssets.length}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAll}
                      disabled={selectedAssets.length === 0}
                    >
                      <Minus className="w-3 h-3 mr-1" />
                      None
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {availableAssets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No assets available for transfer</p>
                    </div>
                  ) : (
                    availableAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => handleAssetToggle(asset)}
                      >
                        <Checkbox
                          checked={selectedAssets.some((a: TransferAsset) => a.id === asset.id)}
                          onCheckedChange={() => handleAssetToggle(asset)}
                        />
                        <Image
                          src={asset.mediaUrl || "/placeholder.svg"}
                          alt={asset.title}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{asset.title}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {asset.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Token #{asset.tokenId}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {selectedAssets.length > 0 && (
                  <div className="mt-4 p-3 bg-accent/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Selected Assets</span>
                      <Badge variant="default">{selectedAssets.length}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recipient Information */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-primary" />
                  <span>Recipient Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="recipient-address" className="text-sm font-medium">
                    Recipient Address *
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="recipient-address"
                      placeholder="0x..."
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      className={`pr-10 ${
                        addressValidation === "valid"
                          ? "border-green-500 focus:border-green-500"
                          : addressValidation === "invalid"
                          ? "border-red-500 focus:border-red-500"
                          : ""
                      }`}
                    />
                    {addressValidation === "valid" && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                    {addressValidation === "invalid" && (
                      <AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
                    )}
                  </div>
                  {addressValidation === "invalid" && (
                    <p className="text-xs text-red-500 mt-1">Invalid Starknet address format</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="recipient-name" className="text-sm font-medium">
                    Recipient Name (Optional)
                  </Label>
                  <Input
                    id="recipient-name"
                    placeholder="Enter recipient name for reference"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="transfer-note" className="text-sm font-medium">
                    Transfer Note (Optional)
                  </Label>
                  <Textarea
                    id="transfer-note"
                    placeholder="Add a note about this transfer..."
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    className="mt-2 resize-none"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Transfer Summary */}
            {canProceed && (
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <span>Transfer Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Assets to Transfer</span>
                      <div className="font-semibold">{selectedAssets.length} asset(s)</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Estimated Gas Fee</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{estimatedFee} ETH</span>
                        {estimatedFee === "0.000" && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            <Zap className="w-3 h-3 mr-1" />
                            Paymaster
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <span className="text-sm text-muted-foreground">Recipient</span>
                    <div className="font-mono text-sm break-all">
                      {recipientName ? (
                        <div>
                          <div className="font-semibold">{recipientName}</div>
                          <div className="text-muted-foreground">{recipientAddress}</div>
                        </div>
                      ) : (
                        recipientAddress
                      )}
                    </div>
                  </div>

                  {transferNote && (
                    <div>
                      <span className="text-sm text-muted-foreground">Note</span>
                      <div className="text-sm bg-background/50 p-2 rounded mt-1">
                        {transferNote}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowPinDialog(true)}
                disabled={!canProceed || isEstimating}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isEstimating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Estimating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Transfer Assets
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* PIN Dialog */}
        <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-primary" />
                <span>Confirm Transfer</span>
              </DialogTitle>
              <DialogDescription>
                Enter your 6-digit PIN to authorize the transfer
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="text-center">
                <PinInput
                  onSubmit={handlePinSubmit}
                  isLoading={isTransferring}
                  title="Authenticate Transfer"
                  description="Enter your wallet PIN to confirm this transfer"
                  submitText="Transfer Asset"
                  error={pinError}
                  onCancel={() => setShowPinDialog(false)}
                />
              </div>

              <div className="bg-accent/30 p-4 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span>Transferring {selectedAssets.length} asset(s)</span>
                  <Badge variant="secondary">
                    {estimatedFee} ETH
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  To: {recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPinDialog(false)}
                  disabled={isTransferring}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handlePinSubmit(pin)}
                  disabled={pin.length !== 6 || isTransferring}
                  className="flex-1"
                >
                  {isTransferring ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Transfer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
