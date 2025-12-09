import { shortString } from "starknet";
import { readFileSync } from "fs";
import yaml from "yaml";

/**
 * Convert array of felts into a string.
 */
export function feltsToString(felts: string[]): string {
  return felts
    .map((f) => {
      try {
        return shortString.decodeShortString(f);
      } catch {
        let hex = BigInt(f).toString(16);
        if (hex.length % 2 !== 0) hex = "0" + hex;
        try {
          return Buffer.from(hex, "hex").toString("utf8");
        } catch {
          return "0x" + hex;
        }
      }
    })
    .join("")
    .replace(/\0/g, "");
}

/**
 * Convert felt to hex address (lowercase, padded).
 */
export function feltToAddress(f: string): string {
  return "0x" + BigInt(f).toString(16).padStart(64, "0");
}



export const openapiSpec = yaml.parse(readFileSync("./openapi.yaml", "utf-8"));