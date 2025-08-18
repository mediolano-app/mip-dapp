export function getExplorerBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://starkscan.co";
  return base.replace(/\/$/, "");
}

export function getExplorerUrlForContract(contractAddress: string): string {
  const base = getExplorerBaseUrl();
  if (base.includes("{contract}")) {
    return base.replace("{contract}", contractAddress);
  }
  return `${base}/contract/${contractAddress}`;
}

export function getExplorerUrlForToken(
  contractAddress: string,
  tokenId?: string | number | null
): string {
  const base = getExplorerBaseUrl();
  if (base.includes("{contract}") || base.includes("{tokenId}")) {
    let url = base.replace("{contract}", contractAddress);
    if (tokenId !== undefined && tokenId !== null && String(tokenId) !== "") {
      url = url.replace("{tokenId}", String(tokenId));
    }
    return url;
  }
  if (tokenId !== undefined && tokenId !== null && String(tokenId) !== "") {
    return `${base}/nft/${contractAddress}/${tokenId}`;
  }
  return `${base}/contract/${contractAddress}`;
}


