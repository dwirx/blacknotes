import { memo, useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning';
  requireInput?: string;
  inputPlaceholder?: string;
  inputLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const ConfirmationDialog = memo(({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  requireInput,
  inputPlaceholder,
  inputLabel,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmationDialogProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(!requireInput);

  // Reset input when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setInputValue('');
      setIsValid(!requireInput);
    }
  }, [open, requireInput]);

  // Validate input
  useEffect(() => {
    if (requireInput) {
      setIsValid(inputValue === requireInput);
    }
  }, [inputValue, requireInput]);

  const handleConfirm = () => {
    if (isValid && !isLoading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <ShieldAlert className="w-6 h-6 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      default:
        return <Info className="w-6 h-6 text-primary" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive';
      case 'warning':
        return 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500';
      default:
        return '';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn(
              "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
              variant === 'danger' && "bg-destructive/10",
              variant === 'warning' && "bg-amber-500/10",
              variant === 'default' && "bg-primary/10"
            )}>
              {getIcon()}
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-lg font-semibold">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-sm text-muted-foreground">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {requireInput && (
          <div className="mt-4 space-y-2">
            <Label htmlFor="confirm-input" className="text-sm font-medium">
              {inputLabel || `Type "${requireInput}" to confirm`}
            </Label>
            <Input
              id="confirm-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputPlaceholder || requireInput}
              className={cn(
                "font-mono",
                !isValid && inputValue.length > 0 && "border-destructive focus-visible:ring-destructive"
              )}
              autoComplete="off"
              autoFocus
            />
            {!isValid && inputValue.length > 0 && (
              <p className="text-xs text-destructive">
                Input doesn't match. Please type exactly: {requireInput}
              </p>
            )}
          </div>
        )}

        <AlertDialogFooter className="mt-6 gap-2 sm:gap-0">
          <AlertDialogCancel
            onClick={handleCancel}
            disabled={isLoading}
            className="mt-0"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className={cn(
              "transition-all",
              getConfirmButtonClass(),
              (!isValid || isLoading) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

ConfirmationDialog.displayName = 'ConfirmationDialog';
