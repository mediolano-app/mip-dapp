import React from "react";
import type { NFTAsset } from "../types/asset";
import type { AssetIP } from "../types/asset";

interface IPAssetCardProps {
  asset: NFTAsset;
  metadata: AssetIP | null;
}

export function IPAssetCard({ asset, metadata }: IPAssetCardProps) {
  // Fallbacks
  const title = metadata?.title || asset.metadata?.name || `Token #${asset.tokenId}`;
  const author = metadata?.author || metadata?.creator?.name || "Unknown";
  const description = metadata?.description || asset.metadata?.description || "No description.";
  const license = metadata?.licenseType || metadata?.licenseDetails || "Unspecified";
  const mediaUrl = metadata?.mediaUrl || asset.metadata?.image || "";
  const type = metadata?.type || "other";
  const timestamp = metadata?.timestamp || "";

  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2 border border-gray-100">
      <div className="text-xs text-gray-400 mb-1 flex justify-between">
        <span>{author}</span>
        {timestamp && <span>{new Date(timestamp).toLocaleString()}</span>}
      </div>
      {mediaUrl ? (
        <img src={mediaUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')} alt={title} className="w-full h-48 object-cover rounded mb-2" />
      ) : (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded mb-2 text-gray-400">No Media</div>
      )}
      <div className="font-semibold text-lg truncate" title={title}>{title}</div>
      <div className="text-sm text-gray-600 line-clamp-2" title={description}>{description}</div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs bg-gray-200 rounded px-2 py-0.5">{type}</span>
        <span className="text-xs bg-gray-100 rounded px-2 py-0.5">License: {license}</span>
      </div>
    </div>
  );
}
