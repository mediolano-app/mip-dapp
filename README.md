<img width="1024" height="500" alt="image" src="https://github.com/user-attachments/assets/9fe73372-a6b9-4867-b1e5-ab1833058567" />


# MIP - My Intellectual Property

MIP is a mobile app that allows users to publish their content onchain for free using their Google account, ensuring greater security and eliminating technical barriers for non-crypto natives.

Within seconds anyone can create an account with self-custody assets and start tokenizing content onchain -- simple, fast, and free. Built for the Integrity Web, MIP empowers intelligence giving creators protection, control and new frontiers.

Built on Starknet: Scalable, Secure, Smart. MIP is powered by Chipi Pay SDK and AVNU Paymaster to let users enjoy gasless transactions and frictionless onboarding. And thanks to Mediolano Protocol, content tokenization is completely free — no hidden fees, no gatekeeping.

## Features:

- No crypto knowledge required - Sign in with Google, get a smart account instantly
- Tokenize Content into onchain assets with zero cost
- Portfolio Manager to track your tokenized content in one place
- Creator Public Profile to showcase your work and build your onchain reputation
- Self-Custody Smart Account to assets ownership without relying on third parties
- Asset interoperability and industry standarts


## Mediolano - Programmable IP for the Integrity Web

Governed by a DAO (Decentralized Autonomous Organization), Mediolano champions transparent, decentralized decision-making in alignment with core web3 and cypherpunk principles. Our mission is to foster long-term value and sustainability for the entire ecosystem—from users to partners—by operating in the collective interest of the network.

<a href="https://mediolano.xyz">Website mediolano.xyz</a>




## Contributing

We are building open-source Integrity Web.

Ccontributions are **greatly appreciated**. If you have a feature or suggestion that would our plattform better, please fork the repo and create a pull request with the tag "enhancement".

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/Feature`)
3. Commit your Changes (`git commit -m 'Add some Feature'`)
4. Push to the Branch (`git push origin feature/YourFeature`)
5. Open a Pull Request


## Getting Started

### IPFS Configuration

The MIP dApp now supports IPFS storage for collection metadata and images. To enable IPFS functionality, you'll need to configure server-side environment variables:

Create a `.env.local` file in your project root and add:

```bash
# Pinata IPFS Service Configuration (recommended)
# Note: These are server-side only - do NOT use NEXT_PUBLIC_ prefix
PINATA_JWT=your_pinata_jwt_token
# OR use API key method
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Optional: Custom IPFS Gateway (this one can be public)
NEXT_PUBLIC_PINATA_GATEWAY=https://your-custom-gateway.com/ipfs/
```

#### Getting Pinata Credentials:

1. Sign up for a free account at [pinata.cloud](https://pinata.cloud)
2. Go to API Keys section in your dashboard
3. Create a new API key with pinning permissions
4. Use the JWT token (recommended) or API Key + Secret

> **Note:** If IPFS is not configured, the app will fall back to development mode with simulated IPFS hashes for testing.

### Running locally

Dapp requirements:
- Next.js 15
- React 19
- Node.js 18.18 or later.
- macOS, Windows (including WSL), and Linux are supported.

Clone the repository to your local machine:

```bash
git clone https://github.com/mediolano-app/mip-dapp.git
```
Install dependencies for Next.js 15 + React 19:

```bash
npm install --force
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

<hr>

Quick links:
<br>
<a href="https://mediolano.xyz">Mediolano.xyz</a><br>
<a href="https://ip.mediolano.app">IP Creator Dapp</a><br>
<a href="https://x.com/mediolanoapp">X / Twitter</a><br>
<a href="https://t.me/mediolanoapp">Telegram Group</a>
