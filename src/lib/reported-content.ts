// List of reported Collection IDs that should be hidden from the UI
export const REPORTED_COLLECTIONS: string[] = [
    "200"
]

// List of reported Asset IDs that should be hidden or flagged
// Asset ID format: "contractAddress-tokenId"
export const REPORTED_ASSETS: string[] = [
    "0x384627d22d01c369f542eb0f0a399417bbeec5998611160be6b73af6c91010a-1",
    "0x02611360a62f6693231a38f8941b8f90d6d408a06a598a1f24532bb2fc09d314:69",
    "0x02611360a62f6693231a38f8941b8f90d6d408a06a598a1f24532bb2fc09d314:68"
]

export type ReportStatus = "hidden" | "flagged" | "none"

// Configuration map for granular control
export const CONTENT_STATUS: Record<string, ReportStatus> = {
    "0x384627d22d01c369f542eb0f0a399417bbeec5998611160be6b73af6c91010a-1": "flagged", // Example flagged asset
    "0x02611360a62f6693231a38f8941b8f90d6d408a06a598a1f24532bb2fc09d314:69": "hidden",
    "0x02611360a62f6693231a38f8941b8f90d6d408a06a598a1f24532bb2fc09d314:68": "hidden"
    // Add more here ex: "0x123...-1": "hidden"
}

export function isCollectionReported(collectionId: string): boolean {
    return REPORTED_COLLECTIONS.includes(collectionId)
}

// Helper to normalize ID format (handle both - and : separators)
function normalizeId(id: string): string {
    return id.replace(/-/g, ":").toLowerCase()
}

export function getAssetReportStatus(assetId: string): ReportStatus {
    const normalizedId = normalizeId(assetId)

    // Check specific status map first (normalize keys too)
    for (const [key, status] of Object.entries(CONTENT_STATUS)) {
        if (normalizeId(key) === normalizedId) return status
    }

    // Check blocked list
    if (REPORTED_ASSETS.some(id => normalizeId(id) === normalizedId)) return "hidden"

    return "none"
}

export function isAssetReported(assetId: string): boolean {
    return getAssetReportStatus(assetId) === "hidden"
}
