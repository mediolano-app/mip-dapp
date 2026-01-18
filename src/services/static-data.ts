import {
  FileText,
  ImageIcon,
  MessageSquare,
  Music,
  Palette,
  Video,
} from "lucide-react";

export const assetTypes = [
  {
    id: "post",
    icon: MessageSquare,
    label: "Post",
    color: "from-blue-500 to-cyan-500",
    description: "Social media style post",
  },
  {
    id: "art",
    icon: Palette,
    label: "Art",
    color: "from-pink-500 to-rose-500",
    description: "Digital art & illustrations",
  },
  {
    id: "music",
    icon: Music,
    label: "Music",
    color: "from-purple-500 to-pink-500",
    description: "Audio & compositions",
  },
  {
    id: "video",
    icon: Video,
    label: "Video",
    color: "from-red-500 to-orange-500",
    description: "Films & animations",
  },
  {
    id: "document",
    icon: FileText,
    label: "Document",
    color: "from-blue-500 to-cyan-500",
    description: "Text & research",
  },
  {
    id: "image",
    icon: ImageIcon,
    label: "Photo",
    color: "from-green-500 to-emerald-500",
    description: "Photography & images",
  },
];

export const collections = [
  {
    value: "my-intellectual-property",
    label: "My Intellectual Property",
    description: "Default collection for all IP assets",
  }
];

export const quickTags = [
  "Original",
  "Creative",
  "Digital",
  "Exclusive",
  "Limited",
  "Art",
  "Music",
  "Video",
  "Design",
  "NFT",
  "Blockchain",
  "IP",
];

export const licenseType = [
  "All Rights Reserved",
  "Creative Commons",
  "Open Source",
  "Custom License",
];
