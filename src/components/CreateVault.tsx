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
import { ArrowLeft, Copy, Check, RefreshCw, AlertTriangle, Shield, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CreateVaultProps {
  onBack: () => void;
}

export function CreateVault({ onBack }: CreateVaultProps) {
  const [mnemonic, setMnemonic] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
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
        title: 'Tersalin!',
        description: 'Recovery phrase telah disalin ke clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Gagal menyalin',
        description: 'Silakan salin secara manual',
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
        title: 'Konfirmasi diperlukan',
        description: 'Pastikan Anda sudah menyimpan recovery phrase',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const result = await createVault(mnemonic);
      if (result.success) {
        setShowSuccess(true);
        toast({
          title: 'Vault berhasil dibuat!',
          description: 'Vault terenkripsi Anda siap digunakan',
        });
      } else {
        toast({
          title: 'Gagal membuat vault',
          description: 'Silakan coba lagi',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Vault creation error:', error);
      toast({
        title: 'Error',
        description: 'Gagal membuat vault',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const words = mnemonic.split(' ');

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Vault Berhasil Dibuat!</h2>
          <p className="text-gray-400">Mengalihkan ke aplikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -right-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-3xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                <BlackNotesLogo className="h-10" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-4 w-4 text-green-500 animate-pulse" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Buat Vault Baru</h1>
          <p className="text-gray-400">
            Simpan 12 kata recovery phrase dengan aman
          </p>
        </div>

        {/* Recovery Phrase Card */}
        <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-sm shadow-2xl mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-green-500" />
              Recovery Phrase Anda
            </CardTitle>
            <CardDescription className="text-gray-400">
              Tulis dan simpan di tempat yang aman. Anda membutuhkannya untuk mengakses vault.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mnemonic Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-4 bg-gray-950/50 rounded-lg border border-gray-800">
              {words.map((word, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-2 p-2.5 bg-gray-900/50 rounded-lg border border-gray-800",
                    "hover:border-gray-700 transition-colors"
                  )}
                >
                  <span className="text-gray-500 font-mono text-xs min-w-[20px]">
                    {index + 1}.
                  </span>
                  <span className="text-white font-mono font-medium text-sm">{word}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleCopy}
                variant="outline"
                className={cn(
                  "flex-1 border-gray-700 hover:bg-gray-800 hover:border-gray-600 transition-all",
                  copied && "border-green-600 bg-green-950/30"
                )}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Salin Phrase
                  </>
                )}
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="border-gray-700 hover:bg-gray-800 hover:border-gray-600 transition-all"
                title="Generate phrase baru"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Warning Alert */}
        <Alert className="bg-amber-950/30 border-amber-900/50 mb-6">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-200/90 ml-2">
            <strong>Penting:</strong> Recovery phrase ini adalah SATU-SATUNYA cara untuk mengakses vault Anda.
            Tidak ada reset password. Jika hilang, data tidak dapat dipulihkan.
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
                className="mt-0.5"
              />
              <label
                htmlFor="confirm"
                className="text-sm text-gray-300 cursor-pointer leading-relaxed"
              >
                Saya sudah menyimpan 12 kata recovery phrase dengan aman. Saya mengerti bahwa tanpa phrase ini,
                saya akan kehilangan akses ke vault dan semua data terenkripsi secara permanen.
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Create Button */}
        <Button
          onClick={handleCreateVault}
          disabled={!confirmed || isCreating}
          className={cn(
            "w-full h-12 text-lg font-medium transition-all",
            confirmed 
              ? "bg-green-600 hover:bg-green-500 text-white" 
              : "bg-gray-700 text-gray-400"
          )}
          size="lg"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Membuat Vault...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-5 w-5" />
              Buat Vault
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
