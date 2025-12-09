"use client";

import * as React from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCreateWallet } from "@chipi-stack/nextjs";
import { completeOnboarding } from "./_actions";

export default function OnboardingComponent() {
  // Access the current user's data
  const { user } = useUser();
  const router = useRouter();

  const { createWalletAsync, isLoading, isError } = useCreateWallet();
  const { getToken } = useAuth();

  // State for form validation and errors
  const [pinError, setPinError] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string>("");

  // PIN validation function
  const validatePin = (pin: string): string => {
    if (!pin || pin.trim() === '') {
      return 'PIN is required';
    }
    if (!/^\d+$/.test(pin)) {
      return 'PIN must contain only numbers';
    }
    if (pin.length < 6) {
      return 'PIN must be at least 6 characters';
    }
    if (pin.length > 12) {
      return 'PIN must be no more than 12 characters';
    }
    return '';
  };




  // Handle PIN input change for real-time validation
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value;
    const error = validatePin(pin);
    setPinError(error);
    // Clear general error when user starts typing
    if (generalError) {
      setGeneralError("");
    }
  };

  // This function handles the form submission
  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setGeneralError("");

      const pin = formData.get('pin') as string;

      // Validate PIN
      const pinValidationError = validatePin(pin);
      if (pinValidationError) {
        setPinError(pinValidationError);
        return;
      }

      console.log('Creating wallet...');
      const token = await getToken({ template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME });
      console.log("Token received:", token);
      if (!token) {
        throw new Error("No bearer token found");
      }

      const response = await createWalletAsync({
        params:{ 
          encryptKey: pin,
          externalUserId:  user?.id as any,
        },
        bearerToken: token,
      });
      
      console.log('Wallet creation response:', response);

      if (!response.txHash || !response.wallet) {
        throw new Error('Failed to create wallet');
      }

      console.log('Updating Clerk metadata...');

      const result = await completeOnboarding({
        publicKey: response.wallet.publicKey,
        encryptedPrivateKey: response.wallet.encryptedPrivateKey,
      });
      console.log('Clerk update result:', result);

      if (result.error) {
        throw new Error(result.error);
      }

      await user?.reload();

      window.location.assign("/");
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setGeneralError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || isSubmitting) {
    return (
      <main className="min-h-screen  flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="backdrop-blur-md bg-blue-400/10 p-8 rounded-2xl shadow-2xl max-w-md w-full  border border-blue-300/20 text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-300 mx-auto mb-4"></div>
          <div className=" font-semibold">Creating your account...</div>
          <p className="text-sm  mt-2">Setting up your self-custody wallet.</p>
        </motion.div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="min-h-screen  flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="backdrop-blur-md bg-red-400/10 p-8 rounded-2xl shadow-2xl max-w-md w-full  border border-red-300/20 text-center"
        >
          <div className="text-red-300 font-semibold text-xl mb-2">⚠️ Error</div>
          <p className="text-red-200/70">Failed to create wallet. Please try again or contact our support.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-400/20 hover:bg-red-400/30 transition  rounded-lg font-medium"
          >
            Try Again
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen  flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="backdrop-blur-md p-8 rounded-2xl shadow-2xl max-w-md w-full  border border-blue-300/20"
      >
        <h1 className="text-3xl font-extrabold mb-4 ">Secure your assets</h1>
        <p className=" mb-6">Create your secure code to get started</p>

        {generalError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-400/10 border border-red-300/20 rounded-lg"
          >
            <p className="text-red-300 text-sm font-medium">❌ {generalError}</p>
          </motion.div>
        )}

        <form action={handleSubmit}>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold  mb-2">
                Create your PIN
              </label>
              <p className="text-xs  mb-3">
                This code will protect and secure your assets. Choose 6-12 numbers that you'll remember.
              </p>
              <input
                type="password"
                name="pin"
                inputMode="numeric"
                pattern="[0-9]{6,12}"
                minLength={6}
                maxLength={12}
                required
                onChange={handlePinChange}
                className={`w-full px-3 py-3 bg-blue-200/10 border rounded-lg shadow-sm focus:outline-none focus:ring-2  text-lg tracking-wider transition-all ${pinError
                  ? 'border-red-300/50 focus:ring-red-300/50 focus:border-red-300'
                  : 'border-blue-200/20 focus:ring-blue-300/50 focus:border-blue-300'
                  }`}
                placeholder="Enter 6-12 digit PIN"
              />
              {pinError && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-red-300 text-sm font-medium"
                >
                  ⚠️ {pinError}
                </motion.p>
              )}
              {!pinError && (
                <p className="mt-2  text-xs">
                  💡 Tip: Use a PIN code you can easily remember but others can't guess
                </p>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={!!pinError || isSubmitting}
            className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${pinError || isSubmitting
              ? 'bg-gray-400/20  cursor-not-allowed'
              : 'bg-blue-400/20 hover:bg-blue-400/30  hover:shadow-lg transform hover:scale-[1.02]'
              }`}
          >
            {isSubmitting ? 'Creating wallet account...' : 'Create wallet account'}
          </button>
        </form>
      </motion.div>
    </main>
  )
}