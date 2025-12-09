"use client"

import { useState, useRef, useEffect } from "react"
import { Header } from "@/src/components/header"
import { FloatingNavigation } from "@/src/components/floating-navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Textarea } from "@/src/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { PinInput } from "@/src/components/pin-input"
import { Upload, ImageIcon, LinkIcon, X, FolderOpen, ArrowLeft, FileImage, ExternalLink, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { CollectionPreviewDrawer } from "@/src/components/collection-preview-drawer"
import { useCallAnyContract } from "@chipi-stack/nextjs"
import { getWalletData } from "@/src/app/onboarding/_actions"
import { toast } from "@/src/hooks/use-toast"
import { useAuth } from "@clerk/nextjs"
import { ipfsService, type IPFSMetadata } from "@/src/services/ipfs.service"


// Mediolano Protocol contract address
const COLLECTION_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_COLLECTION_FACTORY_ADDRESS || "0x02f751e0c4f221ffcc5084af0d5f97af1d448670f57b48462d68318ea90e77e3"
const TEMPLATE_TOKEN = process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || ""

interface CollectionFormData {
  name: string
  description: string
  category: string
  coverImage: string
  bannerImage: string
  contractType: string
  externalUrl: string
  visibility: string
  tags: string[]
}

interface ImagePreview {
  file?: File
  url: string
  type: "file" | "url"
}

export default function CreateCollectionPage() {
  const router = useRouter()
  const coverImageRef = useRef<HTMLInputElement>(null)
  const bannerImageRef = useRef<HTMLInputElement>(null)

  // Clerk auth for token generation
  const { getToken } = useAuth()

   // Get Bearer Token from Clerk
 const getBearerToken = async () => {
  return await getToken({ template: TEMPLATE_TOKEN }) 
  }

  // Chipi SDK hooks
  const { callAnyContractAsync, isLoading: isDeploying, isError: deployError } = useCallAnyContract()

  // Form state
  const [formData, setFormData] = useState<CollectionFormData>({
    name: "",
    description: "",
    category: "",
    coverImage: "",
    bannerImage: "",
    contractType: "erc721",
    externalUrl: "",
    visibility: "public",
    tags: [],
  })

  const [coverPreview, setCoverPreview] = useState<ImagePreview | null>(null)
  const [bannerPreview, setBannerPreview] = useState<ImagePreview | null>(null)
  const [uploadMethod, setUploadMethod] = useState<"upload" | "url">("upload")

  // Wallet and deployment state
  const [walletData, setWalletData] = useState<{
    publicKey: string;
    encryptedPrivateKey: string
  } | null>(null)
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [isPinSubmitting, setIsPinSubmitting] = useState(false)
  const [pinError, setPinError] = useState("")
  const [txHash, setTxHash] = useState("")
  const [contractAddress, setContractAddress] = useState("")
  const [currentStep, setCurrentStep] = useState(0)
  const [isUploadingToIPFS, setIsUploadingToIPFS] = useState(false)
  const [ipfsHashes, setIpfsHashes] = useState<{
    metadata?: string
    coverImage?: string
    bannerImage?: string
  }>({})

    // Load wallet data
  useEffect(() => {
    const loadWallet = async () => {
      try {
        const data = await getWalletData()
        if (data?.publicKey && data?.encryptedPrivateKey) {
          setWalletData(data)
        } else {
          toast({
            title: "Wallet Not Found",
            description: "Please complete onboarding to create your wallet",
            variant: "destructive",
          })
          router.push("/onboarding")
        }
      } catch (error) {
        console.error('Error loading wallet:', error)
        toast({
          title: "Error Loading Wallet",
          description: "Failed to load wallet data",
          variant: "destructive",
        })
      }
    }
    loadWallet()
  }, [router])

  const categories = [
    "Digital Art",
    "Audio",
    "Publications",
    "Software",
    "Patents",
    "AI Art",
    "Photography",
    "Video",
    "3D Models",
    "Other",
  ]

  const contractTypes = [
    {
      id: "erc721",
      title: "Public Collection NFT ERC-721",
      description: "IP collection of digital assets, following the ERC-721 standard.",
    },
    {
      id: "ip-drop",
      title: "Collection IP Drop",
      description:
        "The IP Drop contract enables large-scale distribution of ERC721A NFTs on Starknet, utilizing a lazy-minting mechanism for direct wallet claims.",
    },
    {
      id: "erc721a",
      title: "Collection Open Edition ERC-721A",
      description:
        "This contract enables minting of NFTs with shared metadata, where each NFT has a unique token ID appended to its name.",
    },
    {
      id: "erc1155",
      title: "Collection ERC-1155",
      description:
        "Each ERC-1155 contract is created by calling a central factory contract, which deploys a minimal proxy contract that is upgradeable.",
    },
    {
      id: "colab",
      title: "Colab IP Collection",
      description:
        "Collaborative NFT collection is a type of smart contract on a blockchain that enables multiple individuals to contribute creatively to an NFT collection.",
    },
  ]

  const handleInputChange = (field: keyof CollectionFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (file: File, type: "cover" | "banner") => {
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file)
      const preview: ImagePreview = { file, url, type: "file" }

      if (type === "cover") {
        setCoverPreview(preview)
        handleInputChange("coverImage", file.name)
      } else {
        setBannerPreview(preview)
        handleInputChange("bannerImage", file.name)
      }
    }
  }

  const handleUrlChange = (url: string, type: "cover" | "banner") => {
    if (url.trim()) {
      const preview: ImagePreview = { url: url.trim(), type: "url" }

      if (type === "cover") {
        setCoverPreview(preview)
        handleInputChange("coverImage", url.trim())
      } else {
        setBannerPreview(preview)
        handleInputChange("bannerImage", url.trim())
      }
    } else {
      if (type === "cover") {
        setCoverPreview(null)
        handleInputChange("coverImage", "")
      } else {
        setBannerPreview(null)
        handleInputChange("bannerImage", "")
      }
    }
  }

  const removeImage = (type: "cover" | "banner") => {
    if (type === "cover") {
      setCoverPreview(null)
      handleInputChange("coverImage", "")
      if (coverImageRef.current) coverImageRef.current.value = ""
    } else {
      setBannerPreview(null)
      handleInputChange("bannerImage", "")
      if (bannerImageRef.current) bannerImageRef.current.value = ""
    }
  }

  // Tags management
  const [currentTag, setCurrentTag] = useState("")

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !formData.tags.includes(trimmedTag) && formData.tags.length < 5) {
      handleInputChange("tags", [...formData.tags, trimmedTag])
    }
  }

  const removeTag = (tagToRemove: string) => {
    handleInputChange("tags", formData.tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCurrentTag(value)

    // Auto-add tag when comma is typed
    if (value.includes(",")) {
      const newTags = value.split(",").map(tag => tag.trim()).filter(tag => tag)
      newTags.forEach(tag => addTag(tag))
      setCurrentTag("")
    }
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentTag.trim()) {
      e.preventDefault()
      addTag(currentTag)
      setCurrentTag("")
    }
    
    // Handle backspace to remove last tag when input is empty
    if (e.key === "Backspace" && !currentTag && formData.tags.length > 0) {
      removeTag(formData.tags[formData.tags.length - 1])
    }
  }


  const creationSteps = [
    { title: "Uploading to IPFS", description: "Storing metadata and images on IPFS" },
    { title: "Preparing Collection", description: "Setting up your collection metadata" },
    { title: "Deploying Contract", description: "Creating smart contract on Starknet" },
    { title: "Finalizing Collection", description: "Making your collection live" },
  ]

  // Create collection with proper step tracking
  const createCollectionWithStepTracking = async (pin: string) => {
    if (!walletData) {
      throw new Error("Wallet data not available")
    }

    const token = await getBearerToken()
    
    if (!token) {
      throw new Error("No bearer token found")
    }

    setIsUploadingToIPFS(true)
    let uploadedImageHashes = { ...ipfsHashes }

    try {
      console.log('Uploading images to IPFS...')

      // Upload cover image to IPFS if it's a file
      if (coverPreview?.type === "file" && coverPreview.file) {
        const coverUpload = await ipfsService.uploadFile(coverPreview.file)
        uploadedImageHashes.coverImage = coverUpload.hash
      }

      // Upload banner image to IPFS if it's a file  
      if (bannerPreview?.type === "file" && bannerPreview.file) {
        const bannerUpload = await ipfsService.uploadFile(bannerPreview.file)
        uploadedImageHashes.bannerImage = bannerUpload.hash
      }

      // Create collection metadata with IPFS hashes
      const collectionMetadata: IPFSMetadata = {
        name: formData.name,
        description: formData.description,
        image: uploadedImageHashes.coverImage 
          ? `ipfs://${uploadedImageHashes.coverImage}` 
          : (coverPreview?.url || ""),
        banner_image: uploadedImageHashes.bannerImage 
          ? `ipfs://${uploadedImageHashes.bannerImage}` 
          : (bannerPreview?.url || ""),
        external_url: formData.externalUrl || "",
        seller_fee_basis_points: 250, // 2.5% royalty
        fee_recipient: walletData.publicKey,
        attributes: [
          { trait_type: "Category", value: formData.category },
          { trait_type: "Contract Type", value: formData.contractType },
          { trait_type: "Creator", value: walletData.publicKey },
        ],
        category: formData.category,
        visibility: formData.visibility,
        type: `${"collection"}/${formData.contractType}`,
        tags: formData.tags.map(tag => tag.trim()).filter(tag => tag),
        created_at: new Date().toISOString()
      }

      const metadataUpload = await ipfsService.uploadMetadata(
        collectionMetadata, 
        `${formData.name} Collection Metadata`
      )
      uploadedImageHashes.metadata = metadataUpload.hash

      // IPFS upload complete - update state and move to step 2
      setIpfsHashes(uploadedImageHashes)
      setIsUploadingToIPFS(false)
      setCurrentStep(1) 
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Step 3: Contract deployment
      setCurrentStep(2)
      await new Promise((resolve) => setTimeout(resolve, 500))

      const callData = [
        formData.name, // collection name
        "MIPCO", // symbol
        `ipfs://${metadataUpload.hash}`, // base URI with IPFS hash
      ]
      
      const call = {
        contractAddress: COLLECTION_FACTORY_ADDRESS,
        entrypoint: "create_collection",
        calldata: callData
      }

      // Create collection using Chipi SDK
      
      const result = await callAnyContractAsync({
        params:{
        encryptKey: pin,
        wallet: {
          publicKey: walletData.publicKey,
          encryptedPrivateKey: walletData.encryptedPrivateKey
        },
        contractAddress: COLLECTION_FACTORY_ADDRESS,
        calls: [call]

        },
        bearerToken: token,
      })
      
      // Step 4: Finalizing
      setCurrentStep(3)
      await new Promise((resolve) => setTimeout(resolve, 600))

      return result
    } catch (error) {
      setIsUploadingToIPFS(false)
      console.error('IPFS upload or collection creation failed:', error)
      throw error
    }
  }

  // Handle collection creation with PIN
  const handleCreateCollectionWithPin = async (pin: string) => {
    setIsPinSubmitting(true)
    setPinError("")
    setCurrentStep(0)
    setShowPinDialog(false) // Close PIN dialog
    
    // Validate form and wallet before proceeding
    if (!isFormValid) {
      const error = "Please fill in all required fields"
      setPinError(error)
      toast({
        title: "Missing Required Fields",
        description: error,
        variant: "destructive",
      })
      setIsPinSubmitting(false)
      throw new Error("Form validation failed")
    }

    if (!walletData) {
      const error = "Please ensure your wallet is properly loaded"
      setPinError(error)
      toast({
        title: "Wallet Not Available",
        description: error,
        variant: "destructive",
      })
      setIsPinSubmitting(false)
      throw new Error("Wallet not available")
    }

    try {
     
      setCurrentStep(0)
      
      
      const result = await createCollectionWithStepTracking(pin)

      if (result) {
        // Clear form on success
        setFormData({
          name: "",
          description: "",
          category: "",
          coverImage: "",
          bannerImage: "",
          contractType: "erc721",
          externalUrl: "",
          visibility: "public",
          tags: [],
        })
        setCoverPreview(null)
        setBannerPreview(null)
        setCurrentTag("")

        setTxHash(result)
        setContractAddress(`0x${Math.random().toString(16).slice(2, 42)}`) // In production, parse from transaction receipt

        toast({
          title: "🎉 Collection Created!",
          description: `Your collection contract has been deployed successfully. Metadata stored on IPFS: ${ipfsHashes.metadata?.slice(0, 12)}...`,
        })

        setIsPinSubmitting(false)
        
        setTimeout(() => {
          router.push("/collections")
        }, 3000)
      }
    } catch (error) {
      console.error('Collection creation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Collection creation failed'
      
      setPinError(errorMessage)
      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive",
      })
      
      setIsPinSubmitting(false)
      setCurrentStep(0)
      throw error // Re-throw so the drawer can handle loading state
    }
  }

  const isFormValid = Boolean(formData.name.trim() && formData.description.trim() && formData.category && formData.contractType && walletData)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <main className="pb-24">
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8 animate-fade-in-up">
              <div className="flex items-center gap-4 mb-6">
                <Link href="/collections">
                  <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Collections
                  </Button>
                </Link>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <FolderOpen className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Create New Collection</h1>
                <p className="text-muted-foreground">Organize your programmable IP assets into curated collections</p>
                {walletData && (
                  <div className="flex items-center justify-center space-x-2 mt-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-muted-foreground">Wallet Connected</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              {/* Basic Information */}
              <Card className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Collection Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter collection name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category.toLowerCase()}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your collection and what makes it unique..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="bg-background/50 min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="externalUrl">External URL</Label>
                      <Input
                        id="externalUrl"
                        placeholder="https://your-collection-website.com"
                        value={formData.externalUrl}
                        onChange={(e) => handleInputChange("externalUrl", e.target.value)}
                        className="bg-background/50"
                      />
                      <p className="text-xs text-muted-foreground">Link to your collection's website or external page</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Visibility</Label>
                      <RadioGroup
                        value={formData.visibility}
                        onValueChange={(value) => handleInputChange("visibility", value)}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="public" id="public" />
                          <Label htmlFor="public">Public</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="private" id="private" />
                          <Label htmlFor="private">Private</Label>
                        </div>
                      </RadioGroup>
                      <p className="text-xs text-muted-foreground">Choose collection visibility</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-background/50 rounded-lg border border-muted-foreground/25">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="flex items-center bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-primary hover:text-primary-dark"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        id="tags"
                        type="text"
                        placeholder={formData.tags.length >= 5 ? "Maximum 5 tags reached" : "Add tags (e.g., #music, #art, #collectible) (max 5)"}
                        value={currentTag}
                        onChange={handleTagInputChange}
                        onKeyDown={handleTagInputKeyDown}
                        disabled={formData.tags.length >= 5}
                        className="flex-1 text-sm bg-transparent outline-none border-none disabled:opacity-50"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Tags help users discover your collection ({formData.tags.length}/5)
                      </p>
                  </div>
                </CardContent>
              </Card>

              {/* Media Upload */}
              <Card className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Collection Images
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Upload Method Toggle */}
                  <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
                    <Button
                      type="button"
                      variant={uploadMethod === "upload" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUploadMethod("upload")}
                      className="hover:scale-105 transition-transform"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </Button>
                    <Button
                      type="button"
                      variant={uploadMethod === "url" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUploadMethod("url")}
                      className="hover:scale-105 transition-transform"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      External URLs
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cover Image */}
                    <div className="space-y-3">
                      <Label>Cover Image</Label>
                      {uploadMethod === "upload" ? (
                        <div className="space-y-3">
                          <input
                            ref={coverImageRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "cover")}
                            className="hidden"
                          />
                          <div
                            onClick={() => coverImageRef.current?.click()}
                            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                          >
                            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Click to upload cover image</p>
                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                          </div>
                        </div>
                      ) : (
                        <Input
                          placeholder="https://example.com/cover-image.jpg"
                          value={formData.coverImage}
                          onChange={(e) => handleUrlChange(e.target.value, "cover")}
                          className="bg-background/50"
                        />
                      )}

                      {/* Cover Image Preview */}
                      {coverPreview && (
                        <div className="relative group">
                          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
                            <Image
                              src={coverPreview.url || "/placeholder.svg"}
                              alt="Cover preview"
                              fill
                              className="object-cover"
                              crossOrigin="anonymous"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeImage("cover")}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            {coverPreview.type === "file" ? (
                              <FileImage className="w-3 h-3" />
                            ) : (
                              <ExternalLink className="w-3 h-3" />
                            )}
                            <span>{coverPreview.type === "file" ? "Uploaded file" : "External URL"}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Banner Image */}
                    <div className="space-y-3">
                      <Label>Banner Image</Label>
                      {uploadMethod === "upload" ? (
                        <div className="space-y-3">
                          <input
                            ref={bannerImageRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "banner")}
                            className="hidden"
                          />
                          <div
                            onClick={() => bannerImageRef.current?.click()}
                            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                          >
                            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Click to upload banner image</p>
                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                          </div>
                        </div>
                      ) : (
                        <Input
                          placeholder="https://example.com/banner-image.jpg"
                          value={formData.bannerImage}
                          onChange={(e) => handleUrlChange(e.target.value, "banner")}
                          className="bg-background/50"
                        />
                      )}

                      {/* Banner Image Preview */}
                      {bannerPreview && (
                        <div className="relative group">
                          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
                            <Image
                              src={bannerPreview.url || "/placeholder.svg"}
                              alt="Banner preview"
                              fill
                              className="object-cover"
                              crossOrigin="anonymous"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeImage("banner")}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            {bannerPreview.type === "file" ? (
                              <FileImage className="w-3 h-3" />
                            ) : (
                              <ExternalLink className="w-3 h-3" />
                            )}
                            <span>{bannerPreview.type === "file" ? "Uploaded file" : "External URL"}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Collection Settings */}
              <Card className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                <CardHeader>
                  <CardTitle>Collection Contract Type *</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose the smart contract type that best fits your collection needs
                  </p>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={formData.contractType}
                    onValueChange={(value) => handleInputChange("contractType", value)}
                    className="space-y-4"
                  >
                    {contractTypes.map((contract) => (
                      <div
                        key={contract.id}
                        className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <RadioGroupItem value={contract.id} id={contract.id} className="mt-1" />
                        <div className="flex-1 space-y-1">
                          <Label htmlFor={contract.id} className="text-base font-medium cursor-pointer">
                            {contract.title}
                          </Label>
                          <p className="text-sm text-muted-foreground leading-relaxed">{contract.description}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Preview & Create Button */}
              <div className="flex justify-center animate-fade-in-up" style={{ animationDelay: "400ms" }}>
                <CollectionPreviewDrawer
                  formData={formData}
                  coverPreview={coverPreview}
                  bannerPreview={bannerPreview}
                  isFormValid={isFormValid}
                  onShowPinDialog={() => setShowPinDialog(true)}
                  isCreating={isPinSubmitting || isUploadingToIPFS}
                  creationComplete={!!txHash}
                  currentStep={currentStep}
                  creationSteps={creationSteps}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Authenticate Collection Creation</DialogTitle>
          </DialogHeader>
          <PinInput
            onSubmit={handleCreateCollectionWithPin}
            isLoading={isPinSubmitting}
            title="Authenticate Collection Creation"
            description="Enter your wallet PIN to create your collection"
            submitText="Create Collection"
            error={pinError}
            onCancel={() => setShowPinDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
