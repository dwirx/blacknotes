/**
 * Create Vault Component
 * Generates 12-word mnemonic and creates encrypted vault
 */

import { useState, useEffect } from 'react';
import { useVaultStore } from '@/stores/vaultStore';
import { generateMnemonic } from '@/lib/crypto';
import { BlackNotesLogo } from './BlackNotesLogo';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { ArrowLeft, Copy, Check, RefreshCw, AlertTriangle, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateVaultProps {
  onBack: () => void;
}

export function CreateVault({ onBack }: CreateVaultProps) {
  const [mnemonic, setMnemonic] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { createVault } = useVaultStore();
  const { toast } = useToast();

  useEffect(() => {
    // Generate mnemonic on mount
    setMnemonic(generateMnemonic());
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic);
      setCopied(true);
      toast({
        title: 'Copied to clipboard',
        description: 'Your recovery phrase has been copied',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Please copy the phrase manually',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = () => {
    setMnemonic(generateMnemonic());
    setCopied(false);
    setConfirmed(false);
  };

  const handleCreateVault = async () => {
    if (!confirmed) {
      toast({
        title: 'Confirmation required',
        description: 'Please confirm you have saved your recovery phrase',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const result = await createVault(mnemonic);
      if (result.success) {
        toast({
          title: 'Vault created!',
          description: 'Your encrypted vault is ready',
        });
        // Vault is now unlocked, app will redirect to main interface
      } else {
        toast({
          title: 'Failed to create vault',
          description: 'Please try again',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Vault creation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create vault',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const words = mnemonic.split(' ');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BlackNotesLogo className="h-12" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Your Vault</h1>
          <p className="text-gray-400">
            Save your 12-word recovery phrase securely
          </p>
        </div>

        <Card className="bg-gray-900/70 border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              Your Recovery Phrase
            </CardTitle>
            <CardDescription className="text-gray-400">
              Write this down and store it in a safe place. You'll need it to access your vault.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mnemonic Grid */}
            <div className="grid grid-cols-3 gap-3 p-6 bg-gray-950/50 rounded-lg border border-gray-800">
              {words.map((word, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-gray-900/50 rounded border border-gray-800"
                >
                  <span className="text-gray-500 font-mono text-sm min-w-[24px]">
                    {index + 1}.
                  </span>
                  <span className="text-white font-mono font-semibold">{word}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleCopy}
                variant="outline"
                className="flex-1 border-gray-700 hover:bg-gray-800"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Phrase
                  </>
                )}
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="border-gray-700 hover:bg-gray-800"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Alert className="bg-amber-950/30 border-amber-900 mb-6">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-200 ml-2">
            <strong>Important:</strong> This recovery phrase is the ONLY way to access your vault.
            There is no password reset. If you lose it, your data cannot be recovered.
          </AlertDescription>
        </Alert>

        {/* Confirmation */}
        <Card className="bg-gray-900/70 border-gray-800 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Checkbox
                id="confirm"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                className="mt-1"
              />
              <label
                htmlFor="confirm"
                className="text-sm text-gray-300 cursor-pointer leading-relaxed"
              >
                I have securely saved my 12-word recovery phrase. I understand that without it,
                I will permanently lose access to my vault and all encrypted data.
              </label>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleCreateVault}
          disabled={!confirmed || isCreating}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg"
          size="lg"
        >
          {isCreating ? 'Creating Vault...' : 'Create Vault'}
        </Button>
      </div>
    </div>
  );
}
