"use client";

import * as Yup from "yup";
import type React from "react";
import { useState, useRef, useCallback, Fragment } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import { Switch } from "@/src/components/ui/switch";
import { Separator } from "@/src/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { PinInput } from "@/src/components/pin-input";
import {
  FileText,
  Shield,
  Zap,
  Clock,
  Globe,
  X,
  Plus,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Hash,
  Settings,
  Wand2,
  ExternalLink,
  PenTool,
} from "lucide-react";
import { toast } from "@/src/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useCallAnyContract } from "@chipi-pay/chipi-sdk";
import { useAuth, useUser } from "@clerk/nextjs";
import { FormWrapper } from "../ui/forms/wrapper";
import { TextAreaInput, TextInput } from "../ui/forms/input";
import {
  assetTypes,
  collections,
  licenseType,
  quickTags,
} from "@/src/services/static-data";
import { CONTRACTS } from "@/src/services/constant";
import { SelectInput } from "../ui/forms/select-input";
import { handleNewTagChange, handleNewTagKeyDown, tryAddTag } from "./util";
import MediaUploader, { MediaUploaderRef } from "../mediaUploader";
import { useIpfsUpload } from "@/src/hooks/useIpfs";

// Mediolano Protocol contract address
const MEDIOLANO_CONTRACT = CONTRACTS.MEDIOLANO;

const validationSchema = Yup.object().shape({
  title: Yup.string().required("Title is required"),
  description: Yup.string().required("Description is required"),
  mediaUrl: Yup.string().url("Media URL must be a valid URL").nullable(),
  externalUrl: Yup.string().url("External URL must be a valid URL").nullable(),
  // Advanced fields
  tags: Yup.array().of(Yup.string()),
  author: Yup.string().required("Author is required"),
  ipVersion: Yup.string().matches(/^\d+(\.\d+)?$/, "Invalid IP version"),
  commercialUse: Yup.boolean(),
  modifications: Yup.boolean(),
  attribution: Yup.boolean(),
  registrationDate: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .required("Registration date is required"),
});

export default function CreateAssetView() {
  const router = useRouter();
  const uploaderRef = useRef<MediaUploaderRef>(null);
  const { getToken } = useAuth();
  const { user } = useUser();
  const publicKey = user?.publicMetadata?.publicKey as string;
  const encryptedPrivateKey = user?.publicMetadata
    ?.encryptedPrivateKey as string;
  const {
    callAnyContractAsync,
    isLoading: isMinting,
    // error: mintError,
  } = useCallAnyContract();
  const { uploadToIpfs, loading } = useIpfsUpload();
  // Upload and media state
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const [showPinDialog, setShowPinDialog] = useState(false);
  const [isPinSubmitting, setIsPinSubmitting] = useState(false);
  const [pinError, setPinError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [tokenId, setTokenId] = useState("");

  const initialValues = {
    title: "",
    description: "",
    mediaUrl: "",
    externalUrl: "https://mip.mediolano.app",

    // Advanced fields with smart defaults
    type: "post", // Default to "Post" like social media
    tags: [] as string[],
    author: "",
    collection: collections[0].label, // Default to MIP Collection
    licenceType: licenseType[0],
    licenseDetails: "",
    ipVersion: "1.0",
    commercialUse: false,
    modifications: false,
    attribution: true,
    registrationDate: new Date().toISOString().split("T")[0],
    protectionStatus: "Protected",
    protectionScope: "Global",
    protectionDuration: "50~70 years",
    newTag: "",
  };

  // Handle PIN submission for minting
  const handlePinSubmit = async (pin: string, values: typeof initialValues) => {
    if (!user) {
      setPinError("Wallet data not available");
      return;
    }

    setIsPinSubmitting(true);
    setPinError("");

    try {
      const token = await getToken({
        template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME,
      });

      if (!token) {
        throw new Error("No bearer token found");
      }

      // Create metadata object (in production, this would be uploaded to IPFS)
      const metadata = {
        name: values.title,
        description: values.description,
        image: values.mediaUrl,
        external_url: values.externalUrl,
        attributes: [
          { trait_type: "Type", value: values.type },
          { trait_type: "License", value: values.licenceType },
          {
            trait_type: "Commercial Use",
            value: values.commercialUse.toString(),
          },
          {
            trait_type: "Modifications",
            value: values.modifications.toString(),
          },
          {
            trait_type: "Attribution",
            value: values.attribution.toString(),
          },
          { trait_type: "IP Version", value: values.ipVersion },
          {
            trait_type: "Protection Status",
            value: values.protectionStatus,
          },
          { trait_type: "Protection Scope", value: values.protectionScope },
          { trait_type: "Tags", value: values.tags.join(", ") },
        ],
        properties: {
          creator: values.author,
          collection: values.collection,
          license_details: values.licenseDetails,
          registration_date: values.registrationDate,
          protection_duration: values.protectionDuration,
        },
      };

      const file = await uploaderRef.current?.getFileAsync();
      if (!file) {
        toast({
          title: "Select a Valid file and try again",
          variant: "destructive",
        });
        setShowPinDialog(false);
        return;
      }

      const result = await uploadToIpfs(file, metadata);
      console.log("Uploaded:", result);

      // Mint NFT using Chipi SDK's callAnyContract
      const mintResult = await callAnyContractAsync({
        encryptKey: pin,
        bearerToken: token,
        wallet: {
          publicKey: publicKey,
          encryptedPrivateKey: encryptedPrivateKey,
        },
        contractAddress: MEDIOLANO_CONTRACT,
        calls: [
          {
            contractAddress: MEDIOLANO_CONTRACT,
            entrypoint: "mint_item",
            calldata: [
              publicKey, //
              result.cid, // tokenURI (metadata)
            ],
          },
        ],
      });

      console.log("Mint result:", mintResult);

      if (mintResult) {
        setTxHash(mintResult);
        setTokenId(Date.now().toString()); // In production, parse from transaction receipt
        setShowPinDialog(false);

        toast({
          title: "🎉 IP Asset Created!",
          description: "Your content is now protected on the blockchain",
        });

        // Force full reload to ensure latest data
        window.location.assign("/portfolio");
      }
    } catch (error) {
      console.error("Minting failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Minting failed";
      setPinError(errorMessage);

      toast({
        title: "Minting Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPinSubmitting(false);
    }
  };

  const handleCreate = useCallback(async () => {
    if (!user) {
      toast({
        title: "Wallet Not Available",
        description: "Please ensure your wallet is properly loaded",
        variant: "destructive",
      });
      return;
    }

    // Show PIN dialog for authentication
    setShowPinDialog(true);
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-background">
      <main className="pb-20">
        <div className="px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Create New Asset
                  </h1>
                </div>
                <p className="text-muted-foreground text-sm">
                  Share your creative work and protect it as intellectual
                  property
                </p>
              </div>

              <FormWrapper
                validationSchema={validationSchema}
                initialValues={initialValues}
                validateOnMount
                onSubmit={(val) => console.log("")}
                formProps={{
                  className: "grid  gap-6",
                }}
                enableReinitialize
              >
                {({ values, setFieldValue, isValid }) => (
                  <Fragment>
                    {/* Main Creation Form */}
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                      <CardContent className="p-6 space-y-6">
                        {/* Title - Primary Field */}
                        <TextInput
                          placeholder="What's your creation called?"
                          label="Title"
                          name="title"
                          labelIcon={
                            <PenTool className="w-5 h-5 text-primary" />
                          }
                        />

                        {/* Description - Primary Field */}
                        <TextAreaInput
                          labelIcon={
                            <FileText className="w-5 h-5 text-primary" />
                          }
                          label="Description"
                          name="description"
                        />

                        {/* Media Upload - Optional */}
                        <MediaUploader
                          ref={uploaderRef}
                          onChange={(url, file) => console.log(url)}
                        />
                        {/* External URL - Primary Field */}
                        <TextInput
                          placeholder="https://yourwebsite.com"
                          label="External URL"
                          name="externalUrl"
                          labelIcon={
                            <ExternalLink className="w-5 h-5 text-primary" />
                          }
                        />
                      </CardContent>
                    </Card>

                    {/* Advanced Options - Expandable */}
                    <Collapsible
                      open={isAdvancedOpen}
                      onOpenChange={setIsAdvancedOpen}
                    >
                      <CollapsibleTrigger asChild>
                        <Card className="bg-card/50 backdrop-blur-sm border-border/50 cursor-pointer hover:bg-card/70 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center">
                                  <Settings className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-foreground">
                                    Advanced Options
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    Asset type, tags, collection, and licensing
                                    settings
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {isAdvancedOpen ? "Hide" : "Show"}
                                </Badge>
                                {isAdvancedOpen ? (
                                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <Card className="bg-card/50 backdrop-blur-sm border-border/50 mt-4">
                          <CardContent className="p-6 space-y-6">
                            {/* Asset Type */}
                            <div className="space-y-3">
                              <Label className="text-sm font-medium flex items-center space-x-2">
                                <Wand2 className="w-4 h-4 text-primary" />
                                <span>Asset Type</span>
                              </Label>
                              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                {assetTypes.map((type) => {
                                  const Icon = type.icon;
                                  return (
                                    <button
                                      key={type.id}
                                      onClick={() =>
                                        setFieldValue("type", type.id)
                                      }
                                      className={`p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                                        values.type === type.id
                                          ? "border-primary bg-primary/5 shadow-lg"
                                          : "border-border hover:border-primary/50"
                                      }`}
                                    >
                                      <div className="text-center space-y-2">
                                        <div
                                          className={`w-8 h-8 bg-gradient-to-br ${type.color} rounded-lg flex items-center justify-center mx-auto`}
                                        >
                                          <Icon className="w-4 h-4 text-white" />
                                        </div>
                                        <p className="text-xs font-medium">
                                          {type.label}
                                        </p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <Separator />

                            {/* Collection & Author */}
                            <div className="grid grid-cols-1 items-start md:grid-cols-2 gap-4">
                              <SelectInput
                                label="Collection"
                                data={collections || []}
                                objKey="label"
                                handleChange={(val) => [
                                  setFieldValue("collection", val.label),
                                ]}
                                defaultValue={collections?.[0]?.label}
                                handleSubText={(item) => item.description}
                                name="collection"
                                labelClass="text-sm font-medium flex items-center space-x-2"
                              />

                              <TextInput
                                id="author"
                                placeholder=""
                                label="Author"
                                name="author"
                                showBadge={false}
                                labelClass="text-sm font-medium flex items-center space-x-2"
                              />
                            </div>

                            {/* Tags */}
                            <div className="space-y-3">
                              <Label className="text-sm font-medium flex items-center space-x-2">
                                <Hash className="w-4 h-4 text-primary" />
                                <span>Tags</span>
                              </Label>

                              {/* Quick Tags */}
                              <div className="flex flex-wrap gap-2">
                                {quickTags?.map((tag) => {
                                  const isSelected = values.tags.includes(
                                    tag.toLowerCase()
                                  );
                                  return (
                                    <button
                                      key={tag}
                                      type="button"
                                      onClick={() =>
                                        !isSelected &&
                                        setFieldValue("tags", [
                                          ...values.tags,
                                          tag.toLowerCase(),
                                        ])
                                      }
                                      disabled={isSelected}
                                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-default ${
                                        isSelected
                                          ? "bg-primary text-primary-foreground opacity-70"
                                          : "bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary cursor-pointer"
                                      }`}
                                    >
                                      #{tag}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Custom Tag Input */}
                              <div className="flex space-x-2">
                                <Input
                                  placeholder="Add custom tag..."
                                  onChange={(e) =>
                                    handleNewTagChange(e, setFieldValue)
                                  }
                                  onKeyDown={(e) =>
                                    handleNewTagKeyDown(
                                      e,
                                      values,
                                      setFieldValue,
                                      quickTags
                                    )
                                  }
                                  className="bg-background/50 border-border/50"
                                />
                                <Button
                                  onClick={() =>
                                    tryAddTag(values, setFieldValue, quickTags)
                                  }
                                  size="default"
                                  disabled={!values.newTag.trim()}
                                  className="px-4 h-12"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Selected Tags */}
                              {values.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {values.tags.map((tag, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="bg-primary/10 text-primary border-primary/20 pr-1"
                                    >
                                      #{tag.toLowerCase()}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setFieldValue(
                                            "tags",
                                            values.tags.filter((t) => t !== tag)
                                          )
                                        }
                                        className="ml-2 hover:text-destructive"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            <Separator />

                            {/* License Settings */}
                            <div className="space-y-4">
                              <div className="flex items-center space-x-2">
                                <Shield className="w-4 h-4 text-primary" />
                                <h4 className="font-medium text-foreground">
                                  License & Protection
                                </h4>
                              </div>

                              <SelectInput
                                label="License Type"
                                data={licenseType || []}
                                objKey=""
                                handleRenderValue={(val) => val}
                                defaultValue={licenseType?.[0]}
                                handleChange={(val) => [
                                  setFieldValue("licenceType", val),
                                ]}
                                name="licenceType"
                                labelClass="text-sm font-medium flex items-center space-x-2"
                              />

                              {/* License Permissions */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Commercial Use
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                      Allow commercial usage
                                    </p>
                                  </div>
                                  <Switch
                                    onCheckedChange={(val) =>
                                      setFieldValue("commercialUse", val)
                                    }
                                    name="commercialUse"
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Modifications
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                      Allow derivative works
                                    </p>
                                  </div>
                                  <Switch
                                    name="modifications"
                                    onCheckedChange={(val) =>
                                      setFieldValue("modifications", val)
                                    }
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Require Attribution
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                      Credit required when used
                                    </p>
                                  </div>
                                  <Switch
                                    onCheckedChange={(val) =>
                                      setFieldValue("attribution", val)
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Protection Info */}
                    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                            <Shield className="w-6 h-6 text-primary-foreground" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-foreground mb-2">
                              Blockchain Protection
                            </h3>
                            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                              Your IP will be protected on Starknet with
                              immutable proof of ownership and global copyright
                              protection.
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center">
                                <Clock className="w-6 h-6 mx-auto text-primary mb-1" />
                                <p className="text-xs font-medium">
                                  ~2 minutes
                                </p>
                              </div>
                              <div className="text-center">
                                <Globe className="w-6 h-6 mx-auto text-green-500 mb-1" />
                                <p className="text-xs font-medium">
                                  181 Countries
                                </p>
                              </div>
                              <div className="text-center">
                                <Zap className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                                <p className="text-xs font-medium">Zero Fees</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    {/* Creation Success */}
                    {txHash && (
                      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 animate-fade-in">
                        <CardContent className="pt-6">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-green-900 dark:text-green-100 mb-2">
                                IP Asset Created!
                              </h3>
                              <div className="space-y-2">
                                <p className="text-sm text-green-700 dark:text-green-300">
                                  Your intellectual property has been
                                  successfully minted and protected on the
                                  blockchain.
                                </p>
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                      Token ID:
                                    </span>
                                    <code className="text-xs bg-green-200 dark:bg-green-800 px-2 py-1 rounded font-mono">
                                      {tokenId}
                                    </code>
                                  </div>
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
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Create Button */}
                    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-lg">
                                Ready to Mint?
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {user
                                  ? "Your wallet is connected and ready"
                                  : "Loading wallet..."}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  user ? "bg-green-500" : "bg-yellow-500"
                                } animate-pulse`}
                              ></div>
                              <span className="text-sm text-muted-foreground">
                                {user ? "Ready" : "Loading"}
                              </span>
                            </div>
                          </div>

                          <Dialog
                            open={showPinDialog}
                            onOpenChange={setShowPinDialog}
                          >
                            <DialogTrigger asChild>
                              <Button
                                type="submit"
                                onClick={handleCreate}
                                disabled={isMinting || !user || !isValid}
                                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                              >
                                {isMinting ? (
                                  <div className="flex items-center space-x-3">
                                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                                    <span>Minting Your IP Asset...</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-3">
                                    <Sparkles className="w-6 h-6" />
                                    <span>Mint IP Asset</span>
                                  </div>
                                )}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle className="sr-only">
                                  Authenticate Minting
                                </DialogTitle>
                              </DialogHeader>
                              <PinInput
                                onSubmit={(pin) => handlePinSubmit(pin, values)}
                                isLoading={isPinSubmitting || loading}
                                title="Authenticate Minting"
                                description="Enter your wallet PIN to mint your IP asset"
                                submitText="Mint Asset"
                                error={pinError}
                                onCancel={() => setShowPinDialog(false)}
                              />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  </Fragment>
                )}
              </FormWrapper>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
