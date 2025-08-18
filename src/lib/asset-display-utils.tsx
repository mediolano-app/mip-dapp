import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Music,
  Palette,
  Play,
  Shield,
} from "lucide-react";
import type { JSX } from "react";

export function getMediaIcon(iptype: string) {
  if (!iptype) return Eye;
  switch (iptype.toLowerCase()) {
    case "music":
      return Music;
    case "video":
      return Play;
    case "document":
      return FileText;
    case "art":
    case "image":
      return Palette;
    default:
      return Eye;
  }
}

export function getLicenseColor(licenseType: string) {
  if (!licenseType) return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  switch (licenseType) {
    case "all-rights":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "creative-commons":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "open-source":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "custom":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}

export function getProtectionIcon(status: string): JSX.Element {
  if (!status) return <AlertTriangle className="w-4 h-4 text-gray-500" />;
  switch (status.toLowerCase()) {
    case "protected":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "patent protected":
      return <Shield className="w-4 h-4 text-blue-500" />;
    case "pending":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case "expired":
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    default:
      return <AlertTriangle className="w-4 h-4 text-gray-500" />;
  }
}


