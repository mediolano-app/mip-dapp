"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cairo } from "starknet";
import {
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Badge } from "@/src/components/ui/badge";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { PinInput } from "@/src/components/pin-input";
import {
  ArrowLeft,
  Scan,
  Wallet,
  User,
  MessageSquare,
  Zap,
  Shield,
  Info,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { toast } from "@/src/hooks/use-toast";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransfer } from "@chipi-stack/nextjs";
import { getWalletData } from "@/src/app/onboarding/_actions";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  useWalletAssets,
  useTransactionFeeEstimate,
} from "@/src/hooks/use-wallet-assets";
import { starknetService } from "@/src/services/starknet.service";
import { useCallAnyContract } from "@chipi-stack/nextjs";

// Mediolano Protocol contract address (replace with actual contract)
const MEDIOLANO_CONTRACT =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MIP ||
  "0x04b67deb64d285d3de684246084e74ad25d459989b7336786886ec63a28e0cd4";

export default function TransferPage() {
  const router = useRouter();

  const searchParams = useSearchParams();
  const preselectedAsset = searchParams.get("asset");

  // Clerk auth for token generation
  const { getToken } = useAuth();

  const { callAnyContractAsync } = useCallAnyContract();

  // Chipi SDK hooks
  const {
    transferAsync,
    isLoading: isTransferLoading,
  } = useTransfer();

  // Form state
  const [selectedAsset, setSelectedAsset] = useState(preselectedAsset || "");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [estimatedFee, setEstimatedFee] = useState("0.001");
  const [addressValidation, setAddressValidation] = useState<
    "valid" | "invalid" | ""
  >("");
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);

  // Wallet and transaction state
  const [walletData, setWalletData] = useState<{
    publicKey: string;
    encryptedPrivateKey: string;
  } | null>(null);

  const [showPinDialog, setShowPinDialog] = useState(false);
  const [isPinSubmitting, setIsPinSubmitting] = useState(false);
  const [pinError, setPinError] = useState("");
  const [txHash, setTxHash] = useState("");

  // On-chain data hooks
  const {
    assets: walletAssets,
    nfts,
    tokens,
    isLoading: isLoadingAssets,
    error: assetsError,
    refetch: refetchAssets,
  } = useWalletAssets(walletData?.publicKey || null);

  const { estimateFee, isEstimating } = useTransactionFeeEstimate();

  // Get transferable assets (NFTs for now, can expand to include tokens)
  const ownedAssets = nfts.map((nft) => ({
    id: `${nft.contractAddress}_${nft.tokenId}`,
    slug: `${nft.contractAddress}-${nft.tokenId}`,
    title: nft.metadata?.name || `Token #${nft.tokenId}`,
    description: nft.metadata?.description || "NFT Asset",
    mediaUrl: nft.metadata?.image || "/placeholder.svg",
    type: "NFT",
    licenseType: "all-rights",
    contractAddress: nft.contractAddress,
    tokenId: nft.tokenId,
    attributes: nft.metadata?.attributes || [],
  }));

  const selectedAssetData = ownedAssets.find(
    (asset) => asset.slug === selectedAsset
  );

  // Load wallet data on component mount
  useEffect(() => {
    const loadWallet = async () => {
      try {
        const data = await getWalletData();
        if (data?.publicKey && data?.encryptedPrivateKey) {
          setWalletData(data);
        } else {
          toast({
            title: "Wallet Not Found",
            description: "Please complete onboarding to create your wallet",
            variant: "destructive",
          });
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Error loading wallet:", error);
        toast({
          title: "Error Loading Wallet",
          description: "Failed to load wallet data",
          variant: "destructive",
        });
      }
    };
    loadWallet();
  }, [router]);

  // Validate Starknet address format with debouncing
  const validateAddress = (address: string) => {
    if (!address) {
      setAddressValidation("");
      setIsValidatingAddress(false);
      return;
    }

    setIsValidatingAddress(true);
    const validAddress = starknetService.validateAddress(address);
    setAddressValidation(validAddress ? "valid" : "invalid");
    setIsValidatingAddress(false);
  };

  // Debounced address validation to prevent unresponsiveness
  useEffect(() => {
    if (!recipientAddress) {
      setAddressValidation("");
      setIsValidatingAddress(false);
      return;
    }

    // Only validate if address is long enough (Starknet addresses are 64+ chars)
    if (recipientAddress.length < 10) {
      setAddressValidation("");
      setIsValidatingAddress(false);
      return;
    }

    setIsValidatingAddress(true);

    // Debounce validation to prevent excessive calls
    const timeoutId = setTimeout(() => {
      validateAddress(recipientAddress);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [recipientAddress]);

  // Optimized fee estimation with debouncing
  useEffect(() => {
    if (
      !selectedAssetData ||
      !recipientAddress ||
      !walletData ||
      addressValidation !== "valid"
    ) {
      return;
    }

    const estimateRealFee = async () => {
      try {
        const feeEstimate = await estimateFee(
          selectedAssetData.contractAddress || MEDIOLANO_CONTRACT,
          "transfer", // or "transferFrom" depending on your contract
          [
            walletData.publicKey,
            recipientAddress,
            selectedAssetData.tokenId || "1",
          ],
          walletData.publicKey
        );
        setEstimatedFee(feeEstimate.feeEstimateETH);
      } catch (error) {
        console.error("Fee estimation failed:", error);
        setEstimatedFee("0.002"); // Fallback
      }
    };

    // Debounce fee estimation to prevent excessive API calls
    const timeoutId = setTimeout(estimateRealFee, 1000); // Wait 1 second after validation

    return () => clearTimeout(timeoutId);
  }, [
    selectedAssetData,
    recipientAddress,
    walletData,
    addressValidation,
    estimateFee,
  ]);

  // const transferNFT = async (
  //   from: string,
  //   to: string,
  //   tokenId: string,
  //   token: string,
  //   pin: string
  // ) => {
  //   if (!walletData) {
  //     throw new Error("Wallet data not available");
  //   }
  //   if (!tokenId) {
  //     throw new Error("Token ID is required for NFT transfer");
  //   }

  //   try {

  //     return result;
  //   } catch (error) {
  //     console.error("TransferNFT error details:", error);
  //     throw error;
  //   }
  // };

  // Handle PIN submission for transfer
  const handlePinSubmit = async (pin: string) => {
    if (!walletData || !selectedAssetData) {
      setPinError("Missing wallet or asset data");
      return;
    }

    setIsPinSubmitting(true);
    setPinError("");

    try {
      console.log("Getting Clerk authentication token...");

      const token = await getToken({
        template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME,
      });

      if (!token) {
        throw new Error("No bearer token found");
      }

      console.log("Initiating transfer with PIN...");

      // Validate that we have a tokenId
      if (!selectedAssetData.tokenId) {
        throw new Error("Selected asset does not have a token ID");
      }

      const tokenId = selectedAssetData.tokenId.toString();

      const transferResult = await callAnyContractAsync({
        params: {
          encryptKey: pin,
          wallet: {
            publicKey: walletData.publicKey,
            encryptedPrivateKey: walletData.encryptedPrivateKey,
          },
          contractAddress: MEDIOLANO_CONTRACT,
          calls: [
            {
              contractAddress: MEDIOLANO_CONTRACT,
              entrypoint: "transfer_from",
              calldata: [
                walletData.publicKey,
                recipientAddress,
                cairo.uint256(tokenId),
              ],
            },
          ],
        },
        bearerToken: token,
      });

      console.log("Transfer initiated successfully", transferResult);
      setShowPinDialog(false);

      toast({
        title: "🎉 Transfer Initiated!",
        description: "Your IP asset is being transferred on the blockchain",
      });

      // Optional: redirect after successful transfer
      setTimeout(() => {
        router.push("/portfolio");
      }, 3000);
    } catch (error) {
      console.error("Transfer failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Transfer failed";
      setPinError(errorMessage);

      toast({
        title: "Transfer Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPinSubmitting(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedAsset || !recipientAddress || addressValidation !== "valid") {
      toast({
        title: "Invalid Transfer Details",
        description:
          "Please check all required fields and ensure the address is valid",
        variant: "destructive",
      });
      return;
    }

    if (!walletData) {
      toast({
        title: "Wallet Not Available",
        description: "Please ensure your wallet is properly loaded",
        variant: "destructive",
      });
      return;
    }

    // Show PIN dialog for authentication
    setShowPinDialog(true);
  };

  const isFormValid =
    selectedAsset &&
    recipientAddress &&
    addressValidation === "valid" &&
    walletData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <main className="pb-6">
        <div className="px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8 animate-fade-in-up">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-4 hover:bg-muted/50 hover:scale-105 transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-foreground mb-3">
                  Transfer IP Asset
                </h1>
                <p className="text-muted-foreground text-lg">
                  Send your intellectual property to another wallet securely
                </p>
              </div>

              {/* Error State for Assets */}
              {assetsError && (
                <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                          Failed to load wallet assets
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300">
                          {assetsError}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refetchAssets}
                          className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
                        >
                          Retry
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card
                  className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 hover:scale-105 transition-transform duration-300 animate-fade-in-up"
                  style={{ animationDelay: "100ms" }}
                >
                  <CardContent className="p-4 text-center">
                    <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-2 animate-pulse" />
                    <div className="text-sm font-bold text-blue-900 dark:text-blue-100">
                      {isLoadingAssets ? "..." : ownedAssets.length}
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      Available
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 hover:scale-105 transition-transform duration-300 animate-fade-in-up"
                  style={{ animationDelay: "200ms" }}
                >
                  <CardContent className="p-4 text-center">
                    <Zap className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto mb-2 animate-pulse" />
                    <div className="text-sm font-bold text-green-900 dark:text-green-100">
                      {isEstimating ? "..." : `${estimatedFee} ETH`}
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-300">
                      Est. Fee
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 hover:scale-105 transition-transform duration-300 animate-fade-in-up"
                  style={{ animationDelay: "300ms" }}
                >
                  <CardContent className="p-4 text-center">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 mx-auto mb-2 animate-pulse" />
                    <div className="text-sm font-bold text-purple-900 dark:text-purple-100">
                      {walletData ? "Ready" : "Loading"}
                    </div>
                    <div className="text-xs text-purple-700 dark:text-purple-300">
                      Wallet
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Transfer Form */}
            <div className="space-y-6">
              {/* Asset Selection */}
              <Card
                className="border-border/50 bg-card/50 backdrop-blur-sm animate-fade-in-up"
                style={{ animationDelay: "400ms" }}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    <span>Select Asset</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="asset-select"
                      className="text-sm font-medium"
                    >
                      Choose Asset to Transfer *
                    </Label>
                    <Select
                      value={selectedAsset}
                      onValueChange={setSelectedAsset}
                    >
                      <SelectTrigger className="mt-2 bg-background/50">
                        <SelectValue placeholder="Select an asset from your portfolio" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingAssets ? (
                          <div className="p-4 text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                            <p className="text-sm text-muted-foreground mt-2">
                              Loading assets...
                            </p>
                          </div>
                        ) : ownedAssets.length === 0 ? (
                          <div className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">
                              No assets found
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={refetchAssets}
                              className="mt-2"
                            >
                              Refresh
                            </Button>
                          </div>
                        ) : (
                          ownedAssets.map((asset) => (
                            <SelectItem key={asset.id} value={asset.slug}>
                              <div className="flex items-center space-x-3">
                                <Image
                                  src={asset.mediaUrl || "/placeholder.svg"}
                                  alt={asset.title}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 rounded object-cover"
                                />
                                <div>
                                  <span className="font-medium">
                                    {asset.title}
                                  </span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    ({asset.type})
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedAssetData && (
                    <Card className="bg-muted/20 border-border/30 animate-fade-in">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <Image
                            src={
                              selectedAssetData.mediaUrl || "/placeholder.svg"
                            }
                            alt={selectedAssetData.title}
                            width={60}
                            height={60}
                            className="w-15 h-15 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">
                              {selectedAssetData.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                              {selectedAssetData.description}
                            </p>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs">
                                {selectedAssetData.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Token #{selectedAssetData.tokenId}
                              </Badge>
                              {selectedAssetData.attributes &&
                                selectedAssetData.attributes.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {selectedAssetData.attributes.length} traits
                                  </Badge>
                                )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              {/* Recipient Information */}
              <Card
                className="border-border/50 bg-card/50 backdrop-blur-sm animate-fade-in-up"
                style={{ animationDelay: "500ms" }}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-primary" />
                    <span>Recipient Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="recipient-address"
                      className="text-sm font-medium"
                    >
                      Wallet Address *
                    </Label>
                    <div className="flex space-x-2 mt-2">
                      <div className="relative flex-1">
                        <Input
                          id="recipient-address"
                          placeholder="0x..."
                          value={recipientAddress}
                          onChange={(e) => setRecipientAddress(e.target.value)}
                          className={`bg-background/50 pr-10 transition-all ${
                            addressValidation === "valid"
                              ? "border-green-500 focus:border-green-500"
                              : addressValidation === "invalid"
                              ? "border-red-500 focus:border-red-500"
                              : ""
                          }`}
                        />
                        {addressValidation === "valid" && (
                          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500 animate-pulse" />
                        )}
                        {addressValidation === "invalid" && (
                          <AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500 animate-pulse" />
                        )}
                        {isValidatingAddress && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-primary"></div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-3 hover:scale-105 transition-transform"
                      >
                        <Scan className="w-4 h-4" />
                      </Button>
                    </div>
                    {addressValidation === "invalid" && (
                      <p className="text-xs text-red-500 mt-1 animate-fade-in">
                        Please enter a valid Starknet address
                      </p>
                    )}
                    {addressValidation === "valid" && (
                      <p className="text-xs text-green-500 mt-1 animate-fade-in">
                        Valid Starknet address
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="recipient-name"
                      className="text-sm font-medium"
                    >
                      Recipient Name (Optional)
                    </Label>
                    <Input
                      id="recipient-name"
                      placeholder="Enter recipient name for your records"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="mt-2 bg-background/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Transfer Note */}
              <Card
                className="border-border/50 bg-card/50 backdrop-blur-sm animate-fade-in-up"
                style={{ animationDelay: "600ms" }}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <span>Transfer Note</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label
                      htmlFor="transfer-note"
                      className="text-sm font-medium"
                    >
                      Add a Note (Optional)
                    </Label>
                    <Textarea
                      id="transfer-note"
                      placeholder="Add a note about this transfer for your records..."
                      value={transferNote}
                      onChange={(e) => setTransferNote(e.target.value)}
                      rows={3}
                      className="mt-2 bg-background/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Transfer Summary */}
              {selectedAssetData && recipientAddress && (
                <Card
                  className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 animate-fade-in-up"
                  style={{ animationDelay: "700ms" }}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                        <Info className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground mb-2">
                          Transfer Summary
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Asset:
                            </span>
                            <span className="font-medium text-foreground">
                              {selectedAssetData.title}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">To:</span>
                            <span className="font-medium text-foreground">
                              {recipientName ||
                                `${recipientAddress.slice(
                                  0,
                                  6
                                )}...${recipientAddress.slice(-4)}`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Network Fee:
                            </span>
                            <span className="font-medium text-foreground">
                              {estimatedFee} ETH
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Network:
                            </span>
                            <span className="font-medium text-foreground">
                              Starknet
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transaction Result */}
              {txHash && (
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 animate-fade-in-up">
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-green-900 dark:text-green-100 mb-2">
                          Transfer Initiated!
                        </h3>
                        <div className="space-y-2">
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Your IP asset transfer has been submitted to the
                            blockchain.
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-green-900 dark:text-green-100">
                              Transaction:
                            </span>
                            <code className="text-xs bg-green-200 dark:bg-green-800 px-2 py-1 rounded font-mono break-all">
                              {txHash}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  `${process.env.NEXT_PUBLIC_EXPLORER_URL}/tx/${txHash}`,
                                  "_blank"
                                )
                              }
                              className="shrink-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transfer Button */}
              <div
                className="animate-fade-in-up"
                style={{ animationDelay: "800ms" }}
              >
                <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={handleTransfer}
                      disabled={!isFormValid || isTransferLoading}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 text-lg rounded-xl transition-all hover:scale-105 disabled:hover:scale-100 disabled:opacity-50"
                    >
                      {isTransferLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Processing Transfer...</span>
                        </div>
                      ) : (
                        "Transfer Asset"
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="sr-only">
                        Authenticate Transfer
                      </DialogTitle>
                    </DialogHeader>
                    <PinInput
                      onSubmit={handlePinSubmit}
                      isLoading={isPinSubmitting}
                      title="Authenticate Transfer"
                      description="Enter your wallet PIN to confirm this transfer"
                      submitText="Transfer Asset"
                      error={pinError}
                      onCancel={() => setShowPinDialog(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
