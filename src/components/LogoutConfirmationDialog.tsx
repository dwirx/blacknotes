/**
 * Logout Confirmation Dialog
 * Shows confirmation before logging out with option to keep Remember Me
 */

import { useState } from 'react';
import { useVaultStore } from '@/stores/vaultStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { LogOut, Shield } from 'lucide-react';

interface LogoutConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout?: () => void;
}

export function LogoutConfirmationDialog({
  open,
  onOpenChange,
  onLogout,
}: LogoutConfirmationDialogProps) {
  const { rememberMeSettings, logout, hasSessionToken } = useVaultStore();
  const [clearRememberMe, setClearRememberMe] = useState(true);
  
  const hasActiveSession = hasSessionToken() && rememberMeSettings.enabled;

  const handleLogout = () => {
    logout(clearRememberMe);
    onOpenChange(false);
    onLogout?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-gray-900 border-gray-800 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white flex items-center gap-2">
            <LogOut className="h-5 w-5 text-orange-500" />
            Logout dari Vault
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Anda akan keluar dari vault. Encryption key akan dihapus dari memori
            dan Anda perlu memasukkan recovery phrase untuk login kembali.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasActiveSession && (
          <div className="py-4 border-t border-b border-gray-800">
            <div className="flex items-start gap-3">
              <Checkbox
                id="clearRememberMe"
                checked={clearRememberMe}
                onCheckedChange={(checked) => setClearRememberMe(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <label
                  htmlFor="clearRememberMe"
                  className="text-sm text-gray-300 cursor-pointer flex items-center gap-2"
                >
                  <Shield className="h-4 w-4 text-blue-500" />
                  Hapus sesi "Remember Me"
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {clearRememberMe
                    ? 'Anda harus memasukkan recovery phrase saat login berikutnya'
                    : 'Anda akan otomatis login saat membuka aplikasi lagi'}
                </p>
              </div>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white">
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
