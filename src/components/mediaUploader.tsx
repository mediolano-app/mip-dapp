"use client";
import type React from "react";
import {
  useState,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";

import { Upload, X, CheckCircle, LinkIcon, Camera } from "lucide-react";
import Image from "next/image";
import { toast } from "@/src/hooks/use-toast";

export interface MediaUploaderRef {
  getFileAsync: () => Promise<File | null>;
}

interface MediaUploaderProps {
  label?: string;
  initialUrl?: string;
  onChange: (url: string, file?: File) => void;
}
const MediaUploader = forwardRef<MediaUploaderRef, MediaUploaderProps>(
  ({ label = "Media", initialUrl = "", onChange }, ref) => {
    const [mediaType, setMediaType] = useState<"upload" | "url">("upload");
    const [mediaPreview, setMediaPreview] = useState<string>(initialUrl);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [mediaUrlInput, setMediaUrlInput] = useState(initialUrl);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      getFileAsync: async () => {
        if (mediaFile) return mediaFile;

        if (mediaType === "url" && mediaUrlInput) {
          try {
            const res = await fetch(mediaUrlInput);
            if (!res.ok) throw new Error("Invalid image URL");

            const blob = await res.blob();
            const contentType = blob.type || "image/jpeg";
            const extension = contentType.split("/")[1];
            return new File([blob], `url-media.${extension}`, {
              type: contentType,
            });
          } catch (err) {
            console.error("Error converting URL to file:", err);
            // Don't show toast error here as it might be a valid URL that just blocks CORS
            // The parent component handles the case where file is null but URL is present
            return null;
          }
        }

        return null;
      },
    }));

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    }, []);

    const handleFileInputClick = () => {
      fileInputRef.current?.click();
    };

    const handleFileSelect = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) handleFileChosen(file);
      },
      []
    );

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileChosen(file);
    }, []);

    const handleFileChosen = useCallback(
      (file: File) => {
        setIsUploading(true);
        setUploadProgress(0);
        setMediaFile(file);

        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              setIsUploading(false);

              const reader = new FileReader();
              reader.onload = (e) => {
                const result = e.target?.result as string;
                setMediaPreview(result);
                onChange(result, file);
              };
              reader.readAsDataURL(file);

              return 100;
            }
            return prev + 15;
          });
        }, 150);
      },
      [onChange]
    );

    const handleUrlChange = (url: string) => {
      setMediaUrlInput(url);
      setMediaPreview(url);
      onChange(url);
    };

    const clearMedia = () => {
      setMediaFile(null);
      setMediaPreview("");
      setMediaUrlInput("");
      onChange("");
    };

    return (
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center space-x-2">
          <Upload className="w-5 h-5 text-primary" />
          <span>{label}</span>
          <Badge variant="outline" className="text-xs px-2 py-0">
            Optional
          </Badge>
        </Label>

        <Tabs
          value={mediaType}
          onValueChange={(val) => setMediaType(val as "upload" | "url")}
        >
          <TabsList className="grid max-w-screen-sm grid-cols-2 bg-muted/50">
            <TabsTrigger
              value="upload"
              className="data-[state=active]:bg-background"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </TabsTrigger>
            <TabsTrigger
              value="url"
              className="data-[state=active]:bg-background"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Media URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${isDragOver
                ? "border-primary bg-primary/5"
                : "border-border/50 hover:border-primary/50 hover:bg-muted/20"
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleFileInputClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              />

              {!mediaPreview ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      Drop files here or click to browse your device
                    </p>
                    <p className="text-sm text-muted-foreground">
                      MIP may require access to your camera and photo library to take pictures or let you upload media. Your media is not transmitted to our servers, they will be stored directly on a decentralized file server. You can change permissions at any time in your device settings.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Image
                      src={mediaPreview || "/placeholder.svg"}
                      alt="Preview"
                      width={300}
                      height={150}
                      className="max-w-screen-sm h-32 object-cover rounded-lg mx-auto"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearMedia();
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  {/*
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                     <span>{mediaFile?.name}</span> 
                  </div>
                  */}
                </div>
              )}

              {isUploading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Processing...</p>
                      <Progress value={uploadProgress} className="w-32" />
                      <p className="text-xs text-muted-foreground">
                        {uploadProgress}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="url" className="mt-4">
            <div className="space-y-3">
              <Input
                placeholder="https://example.com/media.jpg"
                value={mediaUrlInput}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="bg-background/50 border-border/50 focus:border-primary"
              />
              {mediaUrlInput && (
                <div className="border rounded-lg overflow-hidden bg-muted/20">
                  <Image
                    src={mediaUrlInput}
                    alt="URL Preview"
                    width={300}
                    height={150}
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
);

export default MediaUploader;
