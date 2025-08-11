  "use client"

import React from "react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { TransferAssetModal } from "@/src/components/transfer-asset-modal"
import { Send, Wallet, Zap, ArrowRight } from "lucide-react"
import { toast } from "@/src/hooks/use-toast"
import type { TransferAsset } from "@/src/hooks/use-transfer-simulation"

// Mock data for demonstration
const mockAssets: TransferAsset[] = [
  {
    id: "1",
    tokenId: "001",
    title: "Digital Art Collection #1",
    mediaUrl: "/placeholder.svg",
    contractAddress: "0x04b67deb64d285d3de684246084e74ad25d459989b7336786886ec63a28e0cd4",
    type: "Digital Art"
  },
  {
    id: "2", 
    tokenId: "002",
    title: "Music Rights Token",
    mediaUrl: "/placeholder.svg",
    contractAddress: "0x04b67deb64d285d3de684246084e74ad25d459989b7336786886ec63a28e0cd4",
    type: "Music IP"
  },
  {
    id: "3",
    tokenId: "003", 
    title: "Patent Documentation",
    mediaUrl: "/placeholder.svg",
    contractAddress: "0x04b67deb64d285d3de684246084e74ad25d459989b7336786886ec63a28e0cd4",
    type: "Patent"
  },
  {
    id: "4",
    tokenId: "004",
    title: "Brand Trademark",
    mediaUrl: "/placeholder.svg", 
    contractAddress: "0x04b67deb64d285d3de684246084e74ad25d459989b7336786886ec63a28e0cd4",
    type: "Trademark"
  }
]

export function TransferDemo() {
  const handleTransferComplete = (txHash: string) => {
    toast({
      title: "Transfer Successful!",
      description: `Transaction completed with hash: ${txHash.slice(0, 10)}...`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Transfer IP Assets</h2>
        <p className="text-muted-foreground">
          Seamlessly transfer ownership of your tokenized IP assets with zero gas fees
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <Send className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Multi-Asset Transfer</h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Transfer multiple assets in a single transaction
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-4 text-center">
            <Zap className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <h3 className="font-semibold text-green-900 dark:text-green-100">Zero Gas Fees</h3>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              AVNU Paymaster covers all transaction costs
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4 text-center">
            <Wallet className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <h3 className="font-semibold text-purple-900 dark:text-purple-100">Secure & Simple</h3>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
              PIN-based authentication with Chipi Pay SDK
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Available Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-primary" />
            <span>Your IP Assets</span>
            <Badge variant="secondary">{mockAssets.length} available</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockAssets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center space-x-3 p-3 rounded-lg border bg-accent/20"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
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
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transfer Actions */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Transfer Options</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Choose how you want to transfer your assets
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Single Asset Transfer */}
          <Card className="border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 text-center">
              <Send className="w-12 h-12 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Transfer Single Asset</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Transfer one specific asset to a recipient
              </p>
              <TransferAssetModal
                availableAssets={mockAssets}
                preselectedAssets={[mockAssets[0]]}
                onTransferComplete={handleTransferComplete}
                trigger={
                  <Button variant="outline" className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Transfer Single Asset
                  </Button>
                }
              />
            </CardContent>
          </Card>

          {/* Multiple Asset Transfer */}
          <Card className="border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="relative mb-4">
                <Send className="w-12 h-12 text-primary mx-auto" />
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-1 bg-primary text-primary-foreground"
                >
                  Multi
                </Badge>
              </div>
              <h4 className="font-semibold mb-2">Transfer Multiple Assets</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Select and transfer multiple assets at once
              </p>
              <TransferAssetModal
                availableAssets={mockAssets}
                onTransferComplete={handleTransferComplete}
                trigger={
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Send className="w-4 h-4 mr-2" />
                    Transfer Multiple Assets
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Transfer */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold mb-1">Quick Transfer All Assets</h4>
              <p className="text-sm text-muted-foreground">
                Transfer all {mockAssets.length} assets to a single recipient
              </p>
            </div>
            <TransferAssetModal
              availableAssets={mockAssets}
              preselectedAssets={mockAssets}
              onTransferComplete={handleTransferComplete}
              trigger={
                <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80">
                  <Send className="w-4 h-4 mr-2" />
                  Transfer All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="bg-accent/30">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h5 className="font-medium mb-1">Gasless Transactions</h5>
              <p className="text-sm text-muted-foreground">
                All transfers are powered by AVNU Paymaster, which covers gas fees automatically. 
                The Chipi Pay SDK handles wallet interactions securely with PIN authentication.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
