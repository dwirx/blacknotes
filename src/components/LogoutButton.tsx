/**
 * Logout Button Component
 * Provides logout functionality with confirmation dialog
 */

import { useState } from 'react';
import { useVaultStore } from '@/stores/vaultStore';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Checkbox } from './ui/checkbox';
import { LogOut, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface LogoutButtonProps {
  className?: string;
  variant?: 'default' | 'icon' | 'text';
  showLabel?: boolean;
}

export function LogoutButton({ 
  className, 
  variant = 'default',
  showLabel = true 
}: LogoutButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [keepRememberMe, setKeepRememberMe] = useState(false);
  const { logout, rememberMeSettings, hasSessionToken } = useVaultStore();
  const { toast } = useToast();

  const hasActiveSession = hasSessionToken() && rememberMeSettings.enabled;

  const handleLogout = () => {
    const clearSession = !keepRememberMe;
    logout(clearSession);
    
    toast({
      title: 'Logged out',
      description: clearSession 
        ? 'You have been logged out and session cleared.' 
        : 'You have been logged out. Session preserved for next login.',
    });
    
    setShowDialog(false);
    setKeepRememberMe(false);
  };

  const buttonContent = (
    <>
      <LogOut className="w-4 h-4" />
      {showLabel && variant !== 'icon' && <span className="ml-2">Logout</span>}
    </>
  );

  return (
    <>
      {variant === 'icon' ? (
        <button
          onClick={() => setShowDialog(true)}
          className={cn(
            "p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
            className
          )}
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      ) : (
        <Button
          onClick={() => setShowDialog(true)}
          variant="ghost"
          size="sm"
          className={cn("text-muted-foreground hover:text-foreground", className)}
        >
          {buttonContent}
        </Button>
      )}

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <LogOut className="w-5 h-5 text-orange-500" />
              Logout dari Vault
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Anda akan keluar dari vault. Encryption key akan dihapus dari memori.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {hasActiveSession && (
            <div className="p-4 rounded-lg bg-gray-950/50 border border-gray-800">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="keepSession"
                  checked={keepRememberMe}
                  onCheckedChange={(checked) => setKeepRememberMe(checked as boolean)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <label
                    htmlFor="keepSession"
                    className="text-sm text-gray-300 cursor-pointer flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4 text-blue-500" />
                    Simpan sesi untuk login cepat
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Anda bisa login kembali tanpa memasukkan recovery phrase
                  </p>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
