/**
 * Vault Authentication Landing Page
 * Users can create a new vault or sign in to existing one
 * With auto-unlock support for Remember Me feature
 */

import { useState, useEffect } from 'react';
import { CreateVault } from './CreateVault';
import { UnlockVault } from './UnlockVault';
import { BlackNotesLogo } from './BlackNotesLogo';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Shield, Lock, HardDrive, Smartphone, Loader2, Sparkles } from 'lucide-react';
import { useVaultStore } from '@/stores/vaultStore';
import { cn } from '@/lib/utils';

type ViewMode = 'landing' | 'create' | 'unlock' | 'auto-unlocking';

export function VaultAuth() {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const { hasSessionToken, autoUnlockWithToken, isVaultCreated } = useVaultStore();

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      if (isVaultCreated && hasSessionToken()) {
        setViewMode('auto-unlocking');
        const success = await autoUnlockWithToken();
        if (!success) {
          setViewMode('landing');
        }
        // If success, the parent component will handle the redirect
      }
      setIsCheckingSession(false);
    };

    checkSession();
  }, [isVaultCreated, hasSessionToken, autoUnlockWithToken]);

  // Show loading while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <BlackNotesLogo className="h-16 mx-auto mb-4 opacity-50" />
          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto" />
        </div>
      </div>
    );
  }

  // Auto-unlocking state
  if (viewMode === 'auto-unlocking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <Lock className="h-10 w-10 text-blue-500" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Membuka Vault...</h2>
          <p className="text-gray-400 text-sm">Menggunakan sesi tersimpan</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'create') {
    return <CreateVault onBack={() => setViewMode('landing')} />;
  }

  if (viewMode === 'unlock') {
    return <UnlockVault onBack={() => setViewMode('landing')} />;
  }

  const features = [
    {
      icon: Shield,
      title: '12-Word Recovery',
      description: 'Akses vault dengan recovery phrase yang aman',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Lock,
      title: 'Client-Side Encryption',
      description: 'Catatan dienkripsi sebelum meninggalkan perangkat',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: HardDrive,
      title: 'Works Offline',
      description: 'Data tersimpan lokal dengan IndexedDB',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Smartphone,
      title: 'Cross-Device',
      description: 'Gunakan recovery phrase di perangkat manapun',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-5xl relative z-10">
        {/* Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-800 shadow-2xl">
                <BlackNotesLogo className="h-14" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            End-to-End Encrypted Notes
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Catatan Anda, diamankan dengan enkripsi client-side. 
            Hanya Anda yang bisa membacanya.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className={cn(
                  "bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-all duration-300",
                  "hover:shadow-lg hover:shadow-gray-900/50 hover:-translate-y-1"
                )}
              >
                <CardContent className="pt-5 pb-4 text-center">
                  <div className={cn("w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center", feature.bgColor)}>
                    <Icon className={cn("h-6 w-6", feature.color)} />
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <Card className="bg-gradient-to-br from-blue-950/50 to-gray-900/50 border-blue-900/50 hover:border-blue-800/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/20 group">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                </div>
                Buat Vault Baru
              </CardTitle>
              <CardDescription className="text-gray-400">
                Generate 12-word recovery phrase untuk vault terenkripsi baru
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setViewMode('create')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11 text-base font-medium transition-all"
                size="lg"
              >
                Buat Vault Baru
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900/50 to-gray-950/50 border-gray-800 hover:border-gray-700 transition-all duration-300 hover:shadow-xl hover:shadow-gray-900/20 group">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gray-700/50 group-hover:bg-gray-700/70 transition-colors">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                Masuk
              </CardTitle>
              <CardDescription className="text-gray-400">
                Akses vault yang sudah ada dengan recovery phrase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setViewMode('unlock')}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white h-11 text-base font-medium transition-all"
                size="lg"
                variant="secondary"
              >
                Masuk ke Vault
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-10 animate-in fade-in duration-700 delay-500">
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Recovery phrase adalah <span className="text-gray-400">SATU-SATUNYA</span> cara untuk mengakses vault Anda.
            Simpan dengan aman dan jangan bagikan kepada siapapun.
          </p>
        </div>
      </div>
    </div>
  );
}
