'use client';

import { StarknetConfig, InjectedConnector, jsonRpcProvider } from '@starknet-react/core';
import { mainnet } from '@starknet-react/chains';
import type { ReactNode } from 'react';

const connectors = [
  new InjectedConnector({ options: { id: 'argentX' } }),
  new InjectedConnector({ options: { id: 'braavos' } }),
];

export default function StarknetProviderWrapper({ children }: { children: ReactNode }) {
  const nodeUrl = process.env.NEXT_PUBLIC_STARKNET_RPC_URL || 'https://starknet-mainnet.public.blastapi.io/rpc/v0_8';
  return (
    <StarknetConfig
      chains={[mainnet]}
      provider={jsonRpcProvider({ rpc: () => ({ nodeUrl }) })}
      connectors={connectors}
      autoConnect
    >
      {children}
    </StarknetConfig>
  );
}
