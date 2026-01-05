/**
 * Unlock Vault Component
 * Sign in with 12-word recovery phrase with Remember Me option
 */

import { useState, useEffect } from 'react';
import { useVaultStore } from '@/stores/vaultStore';
import { validateMnemonic } from '@/lib/crypto';
import { BlackNotesLogo } from './BlackNotesLogo';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { ArrowLeft, Lock, AlertCircle, Shield, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UnlockVaultProps {
  onBack: () => void;
}

export function UnlockVault({ onBack }: UnlockVaultProps) {
  const [mnemonic, setMnemonic] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberDuration, setRememberDuration] = useState<'7' | '30' | '-1'>('7');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { unlockVault, setRememberMe: setRememberMeSettings, rememberMeSettings } = useVaultStore();
  const { toast } = useToast();

  // Initialize from stored settings
  useEffect(() => {
    setRememberMe(rememberMeSettings.enabled);
    setRememberDuration(String(rememberMeSettings.duration) as '7' | '30' | '-1');
  }, [rememberMeSettings]);

  const handleUnlock = async () => {
    setError('');

    const trimmedMnemonic = mnemonic.trim();
    if (!validateMnemonic(trimmedMnemonic)) {
      setError('Recovery phrase tidak valid. Pastikan 12 kata sudah benar.');
      return;
    }

    setIsUnlocking(true);
    
    // Update Remember Me settings before unlocking
    if (rememberMe) {
      setRememberMeSettings(true, parseInt(rememberDuration) as 7 | 30 | -1);
    }

    try {
      const success = await unlockVault(trimmedMnemonic, rememberMe);
      if (success) {
        setShowSuccess(true);
        toast({
          title: 'Vault terbuka!',
          description: 'Selamat datang kembali!',
        });
      } else {
        setError('Recovery phrase salah. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Unlock error:', error);
      setError('Gagal membuka vault. Silakan coba lagi.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setMnemonic(text);
      setError('');
    } catch (error) {
      toast({
        title: 'Paste gagal',
        description: 'Silakan paste secara manual',
        variant: 'destructive',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && mnemonic.trim()) {
      e.preventDefault();
      handleUnlock();
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Vault Terbuka!</h2>
          <p className="text-gray-400">Mengalihkan ke aplikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <BlackNotesLogo className="h-10" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Masuk ke Vault</h1>
          <p className="text-gray-400">
            Masukkan 12 kata recovery phrase Anda
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-sm shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-blue-500" />
              Recovery Phrase
            </CardTitle>
            <CardDescription className="text-gray-400">
              Pisahkan setiap kata dengan spasi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Mnemonic Input */}
            <div className="relative">
              <Textarea
                value={mnemonic}
                onChange={(e) => {
                  setMnemonic(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                placeholder="kata1 kata2 kata3 kata4 kata5 kata6 kata7 kata8 kata9 kata10 kata11 kata12"
                className={cn(
                  "min-h-[100px] font-mono text-sm bg-gray-950/50 border-gray-800 text-white placeholder:text-gray-600 resize-none transition-all",
                  "focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50",
                  error && "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                )}
                autoFocus
              />
              <div className="absolute bottom-2 right-2">
                <span className="text-xs text-gray-500">
                  {mnemonic.trim().split(/\s+/).filter(Boolean).length}/12 kata
                </span>
              </div>
            </div>

            {/* Paste Button */}
            <Button
              onClick={handlePaste}
              variant="outline"
              className="w-full border-gray-700 hover:bg-gray-800 hover:border-gray-600 transition-all"
            >
              Paste dari Clipboard
            </Button>

            {/* Error Message */}
            {error && (
              <Alert className="bg-red-950/30 border-red-900 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-200 ml-2">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Remember Me Section */}
            <div className="p-4 rounded-lg bg-gray-950/50 border border-gray-800 space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <label
                    htmlFor="rememberMe"
                    className="text-sm text-gray-300 cursor-pointer flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4 text-blue-500" />
                    Ingat saya di perangkat ini
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Login otomatis tanpa memasukkan recovery phrase
                  </p>
                </div>
              </div>

              {rememberMe && (
                <div className="pl-6 animate-in fade-in slide-in-from-top-2">
                  <label className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Durasi sesi
                  </label>
                  <Select
                    value={rememberDuration}
                    onValueChange={(value) => setRememberDuration(value as '7' | '30' | '-1')}
                  >
                    <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="7" className="text-gray-300">7 hari</SelectItem>
                      <SelectItem value="30" className="text-gray-300">30 hari</SelectItem>
                      <SelectItem value="-1" className="text-gray-300">Sampai logout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleUnlock}
              disabled={!mnemonic.trim() || isUnlocking}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-medium transition-all disabled:opacity-50"
              size="lg"
            >
              {isUnlocking ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Membuka Vault...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-5 w-5" />
                  Buka Vault
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Belum punya vault?{' '}
          <button
            onClick={onBack}
            className="text-blue-500 hover:text-blue-400 underline transition-colors"
          >
            Buat sekarang
          </button>
        </p>
      </div>
    </div>
  );
}
