/**
 * Logout Button Component
 * Displays a logout button that triggers the confirmation dialog
 */

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoutConfirmationDialog } from './LogoutConfirmationDialog';
import { Button } from './ui/button';

interface LogoutButtonProps {
  className?: string;
  variant?: 'default' | 'ghost' | 'icon';
  showLabel?: boolean;
  onLogout?: () => void;
}

export function LogoutButton({
  className,
  variant = 'ghost',
  showLabel = true,
  onLogout,
}: LogoutButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={() => setShowDialog(true)}
          className={cn(
            'p-2 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors',
            className
          )}
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
        <LogoutConfirmationDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          onLogout={onLogout}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant={variant === 'ghost' ? 'ghost' : 'default'}
        onClick={() => setShowDialog(true)}
        className={cn(
          'text-muted-foreground hover:text-red-500 hover:bg-red-500/10',
          className
        )}
      >
        <LogOut className="w-4 h-4" />
        {showLabel && <span className="ml-2">Logout</span>}
      </Button>
      <LogoutConfirmationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onLogout={onLogout}
      />
    </>
  );
}
