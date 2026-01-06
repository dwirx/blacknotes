import { memo, useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield,
  Copy,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Clock,
  Key,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useVaultStore } from '@/stores/vaultStore';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { copySensitiveData } from '@/lib/clipboard';
import {
  createVaultBackup,
  downloadBackup,
  parseBackupFile,
  getBackupPreview,
  restoreVaultBackup,
  BackupPreview,
} from '@/lib/crypto';
import { db, type Note, type Notebook, type Tag } from '@/lib/db';
import { cn } from '@/lib/utils';

// LocalStorage keys
const STORAGE_KEYS = {
  LAST_BACKUP_DATE: 'hadesnotes-last-backup',
};

interface VaultSettingsProps {
  onVaultDeleted?: () => void;
}

export const VaultSettings = memo(({ onVaultDeleted }: VaultSettingsProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Vault store
  const {
    isVaultCreated,
    isUnlocked,
    vaultId,
    encryptionAlgorithm,
    encryptionKey,
    getMnemonic,
    destroyVault,
    lockVault,
  } = useVaultStore();

  // Local state
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [mnemonicRevealTimer, setMnemonicRevealTimer] = useState<number | null>(null);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Dialog states
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteStep1, setShowDeleteStep1] = useState(false);
  const [showDeleteStep2, setShowDeleteStep2] = useState(false);
  
  // Backup preview
  const [backupPreview, setBackupPreview] = useState<BackupPreview | null>(null);
  const [pendingBackupFile, setPendingBackupFile] = useState<File | null>(null);

  // Load last backup date
  useEffect(() => {
    const savedDate = localStorage.getItem(STORAGE_KEYS.LAST_BACKUP_DATE);
    if (savedDate) {
      setLastBackupDate(savedDate);
    }
  }, []);

  // Auto-hide mnemonic after 30 seconds
  useEffect(() => {
    if (showMnemonic) {
      const timer = window.setTimeout(() => {
        setShowMnemonic(false);
        setMnemonicRevealTimer(null);
      }, 30000);
      
      setMnemonicRevealTimer(30);
      
      const countdown = window.setInterval(() => {
        setMnemonicRevealTimer((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdown);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        clearTimeout(timer);
        clearInterval(countdown);
      };
    }
  }, [showMnemonic]);

  // Get mnemonic safely
  const mnemonic = getMnemonic();
  const maskedMnemonic = mnemonic
    ? mnemonic.split(' ').map(() => '••••').join(' ')
    : '';

  // Copy mnemonic handler
  const handleCopyMnemonic = useCallback(async () => {
    if (!mnemonic) {
      toast({
        title: 'Error',
        description: 'Vault is locked. Please unlock to copy mnemonic.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const success = await copySensitiveData(mnemonic, 60000);
      
      if (success) {
        toast({
          title: 'Mnemonic Copied',
          description: 'Your recovery phrase has been copied. Clipboard will auto-clear in 60 seconds.',
        });
        console.log('🔐 Mnemonic copied to clipboard (will auto-clear)');
      } else {
        throw new Error('Copy failed');
      }
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy mnemonic to clipboard.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setShowCopyDialog(false);
    }
  }, [mnemonic, toast]);

  // Create backup handler
  const handleCreateBackup = useCallback(async () => {
    if (!isUnlocked || !encryptionKey || !vaultId) {
      toast({
        title: 'Error',
        description: 'Vault must be unlocked to create backup.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Get all data from IndexedDB
      const [notes, notebooks, tags, settings] = await Promise.all([
        db.getAllNotes(),
        db.getAllNotebooks(),
        db.getAllTags(),
        db.getSettings(),
      ]);
      const scopedNotes = vaultId ? notes.filter((note) => note.vaultId === vaultId) : notes;
      const scopedNotebooks = vaultId
        ? notebooks.filter((notebook) => notebook.vaultId === vaultId)
        : notebooks;
      const scopedTags = vaultId ? tags.filter((tag) => tag.vaultId === vaultId) : tags;

      // Create encrypted backup
      const backup = await createVaultBackup(
        { notes: scopedNotes as unknown[], notebooks: scopedNotebooks, tags: scopedTags, settings },
        encryptionKey,
        vaultId,
        encryptionAlgorithm
      );

      // Download backup file
      downloadBackup(backup);

      // Save backup date
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.LAST_BACKUP_DATE, now);
      setLastBackupDate(now);

      toast({
        title: 'Backup Created',
        description: 'Your encrypted backup has been downloaded.',
      });
      console.log('📦 Backup created successfully');
    } catch (error) {
      console.error('Backup creation failed:', error);
      toast({
        title: 'Backup Failed',
        description: 'Failed to create backup. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isUnlocked, encryptionKey, vaultId, encryptionAlgorithm, toast]);

  // Handle file selection for restore
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !encryptionKey) return;

    setIsProcessing(true);
    try {
      const backup = await parseBackupFile(file);
      const preview = await getBackupPreview(backup, encryptionKey);

      if (!preview) {
        toast({
          title: 'Wrong Vault Key',
          description: 'This backup was created with a different vault. Cannot decrypt.',
          variant: 'destructive',
        });
        return;
      }

      setBackupPreview(preview);
      setPendingBackupFile(file);
      setShowRestoreDialog(true);
    } catch (error) {
      console.error('Backup parse failed:', error);
      toast({
        title: 'Invalid Backup',
        description: 'The selected file is not a valid backup or is corrupted.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [encryptionKey, toast]);

  // Restore backup handler
  const handleRestoreBackup = useCallback(async () => {
    if (!pendingBackupFile || !encryptionKey || !vaultId) return;

    setIsProcessing(true);
    try {
      const backup = await parseBackupFile(pendingBackupFile);
      const data = await restoreVaultBackup(backup, encryptionKey);

      if (!data) {
        throw new Error('Failed to decrypt backup');
      }

      // Clear existing vault data and import backup
      await db.clearVaultData(vaultId);

      if (data.notes && data.notes.length > 0) {
        const scopedNotes = data.notes.map((note) => ({
          ...note,
          vaultId: note.vaultId ?? vaultId,
        }));
        await db.saveNotes(scopedNotes as unknown as Note[]);
      }
      if (data.notebooks && data.notebooks.length > 0) {
        for (const notebook of data.notebooks as unknown[]) {
          await db.saveNotebook({ ...notebook, vaultId } as unknown as Notebook);
        }
      }
      if (data.tags && data.tags.length > 0) {
        for (const tag of data.tags as unknown[]) {
          await db.saveTag({ ...tag, vaultId } as unknown as Tag);
        }
      }
      if (data.settings) {
        await db.saveSettings(data.settings as Record<string, unknown>);
      }

      toast({
        title: 'Backup Restored',
        description: `Successfully restored ${backupPreview?.noteCount || 0} notes.`,
      });
      console.log('✅ Backup restored successfully');
    } catch (error) {
      console.error('Restore failed:', error);
      toast({
        title: 'Restore Failed',
        description: 'Failed to restore backup. Your data has not been modified.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setShowRestoreDialog(false);
      setBackupPreview(null);
      setPendingBackupFile(null);
    }
  }, [pendingBackupFile, encryptionKey, vaultId, backupPreview, toast]);

  // Delete account handler
  const handleDeleteAccount = useCallback(async () => {
    setIsProcessing(true);
    try {
      // Clear all data from IndexedDB
      await db.clearAll();
      
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.LAST_BACKUP_DATE);
      localStorage.removeItem('hadesnotes-vault');
      
      // Destroy vault state
      destroyVault();

      toast({
        title: 'Account Deleted',
        description: 'Your vault and all data have been permanently deleted.',
      });
      console.log('🗑️ Account deleted successfully');
      
      onVaultDeleted?.();
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setShowDeleteStep2(false);
    }
  }, [destroyVault, toast, onVaultDeleted]);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown';
    }
  };

  // Get algorithm display name
  const getAlgorithmName = (algo: string) => {
    switch (algo) {
      case 'aes-256-gcm':
        return 'AES-256-GCM';
      case 'chacha20-poly1305':
        return 'ChaCha20-Poly1305';
      default:
        return algo;
    }
  };

  return (
    <div className="space-y-6">
      {/* Vault Status Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium">Vault Status</h3>
        </div>
        
        <div className="grid gap-3">
          {/* Status Card */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-3">
              {isUnlocked ? (
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Unlock className="w-5 h-5 text-green-500" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-amber-500" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium">
                  {isUnlocked ? 'Vault Unlocked' : 'Vault Locked'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {vaultId ? `ID: ${vaultId.slice(0, 16)}...` : 'No vault'}
                </p>
              </div>
            </div>
            <Badge variant={isUnlocked ? 'default' : 'secondary'}>
              {isUnlocked ? 'Active' : 'Locked'}
            </Badge>
          </div>

          {/* Encryption Info */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Encryption</p>
                <p className="text-xs text-muted-foreground">
                  {getAlgorithmName(encryptionAlgorithm)}
                </p>
              </div>
            </div>
            <ShieldCheck className="w-5 h-5 text-green-500" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Security Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium">Security</h3>
        </div>

        {/* Mnemonic Display */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Recovery Phrase</Label>
            {mnemonicRevealTimer && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Auto-hide in {mnemonicRevealTimer}s
              </span>
            )}
          </div>
          
          <div className={cn(
            "p-3 rounded-md bg-background border font-mono text-sm break-all transition-all",
            showMnemonic ? "border-primary/50" : "border-border"
          )}>
            {isUnlocked ? (
              showMnemonic ? mnemonic : maskedMnemonic
            ) : (
              <span className="text-muted-foreground italic">Unlock vault to view</span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMnemonic(!showMnemonic)}
              disabled={!isUnlocked}
              className="flex-1"
            >
              {showMnemonic ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Reveal
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCopyDialog(true)}
              disabled={!isUnlocked || isProcessing}
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Backup Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium">Backup & Restore</h3>
        </div>

        {lastBackupDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            Last backup: {formatDate(lastBackupDate)}
          </div>
        )}

        <div className="grid gap-2">
          <Button
            variant="outline"
            onClick={handleCreateBackup}
            disabled={!isUnlocked || isProcessing}
            className="justify-start"
          >
            <Download className="w-4 h-4 mr-2" />
            Create Encrypted Backup
          </Button>

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isUnlocked || isProcessing}
            className="justify-start"
          >
            <Upload className="w-4 h-4 mr-2" />
            Restore from Backup
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Backups are encrypted with your vault key. Keep your recovery phrase safe to restore backups.
        </p>
      </div>

      <Separator />

      {/* Danger Zone */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-4 h-4" />
          <h3 className="text-sm font-medium">Danger Zone</h3>
        </div>

        <div className="p-4 rounded-lg border-2 border-destructive/20 bg-destructive/5 space-y-3">
          <div>
            <p className="text-sm font-medium text-destructive">Delete Account</p>
            <p className="text-xs text-muted-foreground mt-1">
              Permanently delete your vault and all notes. This action cannot be undone.
            </p>
          </div>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteStep1(true)}
            disabled={!isUnlocked || isProcessing}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </div>

      {/* Copy Mnemonic Confirmation Dialog */}
      <ConfirmationDialog
        open={showCopyDialog}
        onOpenChange={setShowCopyDialog}
        title="Copy Recovery Phrase"
        description="Your recovery phrase will be copied to clipboard. Make sure no one is watching your screen. The clipboard will be automatically cleared after 60 seconds."
        confirmText="Copy to Clipboard"
        variant="warning"
        onConfirm={handleCopyMnemonic}
        isLoading={isProcessing}
      />

      {/* Restore Backup Confirmation Dialog */}
      <ConfirmationDialog
        open={showRestoreDialog}
        onOpenChange={(open) => {
          setShowRestoreDialog(open);
          if (!open) {
            setBackupPreview(null);
            setPendingBackupFile(null);
          }
        }}
        title="Restore Backup"
        description={backupPreview ? 
          `This will replace all current data with the backup from ${formatDate(backupPreview.backupDate)}.\n\nBackup contains:\n• ${backupPreview.noteCount} notes\n• ${backupPreview.notebookCount} notebooks\n• ${backupPreview.tagCount} tags` :
          'Restore data from backup file.'
        }
        confirmText="Restore Backup"
        variant="warning"
        onConfirm={handleRestoreBackup}
        isLoading={isProcessing}
      />

      {/* Delete Step 1 Dialog */}
      <ConfirmationDialog
        open={showDeleteStep1}
        onOpenChange={setShowDeleteStep1}
        title="Delete Account"
        description="Are you sure you want to delete your vault? This will permanently remove all your notes, notebooks, and settings. This action cannot be undone."
        confirmText="Continue"
        variant="danger"
        onConfirm={() => {
          setShowDeleteStep1(false);
          setShowDeleteStep2(true);
        }}
      />

      {/* Delete Step 2 Dialog */}
      <ConfirmationDialog
        open={showDeleteStep2}
        onOpenChange={setShowDeleteStep2}
        title="Final Confirmation"
        description="This is your last chance to cancel. Type DELETE below to permanently delete your account."
        confirmText="Delete Forever"
        variant="danger"
        requireInput="DELETE"
        inputLabel="Type DELETE to confirm"
        inputPlaceholder="DELETE"
        onConfirm={handleDeleteAccount}
        isLoading={isProcessing}
      />
    </div>
  );
});

VaultSettings.displayName = 'VaultSettings';
