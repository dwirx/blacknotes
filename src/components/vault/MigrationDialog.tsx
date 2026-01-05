/**
 * Migration Dialog - Upgrade vault from v1 to v2 encryption format
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { MigrationResult } from '@/lib/crypto-v2';

interface MigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMigrate: () => Promise<MigrationResult>;
  noteCount: number;
}

type MigrationState = 'idle' | 'migrating' | 'success' | 'partial' | 'error';

export function MigrationDialog({
  open,
  onOpenChange,
  onMigrate,
  noteCount,
}: MigrationDialogProps) {
  const [state, setState] = useState<MigrationState>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const handleMigrate = async () => {
    setState('migrating');
    setProgress(10);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const migrationResult = await onMigrate();
      
      clearInterval(progressInterval);
      setProgress(100);
      setResult(migrationResult);

      if (migrationResult.success) {
        setState('success');
      } else if (migrationResult.migratedCount > 0) {
        setState('partial');
      } else {
        setState('error');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      setState('error');
      setResult({
        success: false,
        migratedCount: 0,
        failedCount: noteCount,
        errors: [{ noteId: 'unknown', error: String(error) }],
      });
    }
  };

  const handleClose = () => {
    if (state !== 'migrating') {
      setState('idle');
      setProgress(0);
      setResult(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Upgrade Encryption
          </DialogTitle>
          <DialogDescription>
            Upgrade your vault to use enhanced encryption with Argon2id and
            XChaCha20-Poly1305.
          </DialogDescription>
        </DialogHeader>


        <div className="py-4">
          {state === 'idle' && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-medium mb-2">What will be upgraded:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Key derivation: PBKDF2 → Argon2id (64MB memory)</li>
                  <li>• Encryption: AES-GCM → XChaCha20-Poly1305</li>
                  <li>• Metadata: All note metadata will be encrypted</li>
                  <li>• AAD binding: Notes bound to vault ID</li>
                  <li>• Padding: 1KB padding for size privacy</li>
                </ul>
              </div>
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">
                  {noteCount} note{noteCount !== 1 ? 's' : ''} will be re-encrypted
                </span>
              </div>
            </div>
          )}

          {state === 'migrating' && (
            <div className="space-y-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                Migrating notes... Please don't close this window.
              </p>
            </div>
          )}

          {state === 'success' && result && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-8 w-8" />
              </div>
              <p className="text-center">
                Successfully migrated {result.migratedCount} note
                {result.migratedCount !== 1 ? 's' : ''} to v2 format!
              </p>
            </div>
          )}

          {state === 'partial' && result && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <p className="text-center">
                Migrated {result.migratedCount} note
                {result.migratedCount !== 1 ? 's' : ''}, but{' '}
                {result.failedCount} failed.
              </p>
              {result.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded bg-muted p-2 text-xs">
                  {result.errors.map((err, i) => (
                    <div key={i} className="text-red-500">
                      Note {err.noteId}: {err.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                <XCircle className="h-8 w-8" />
              </div>
              <p className="text-center text-red-600 dark:text-red-400">
                Migration failed. Your notes remain in the original format.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {state === 'idle' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleMigrate}>
                Start Migration
              </Button>
            </>
          )}
          {(state === 'success' || state === 'partial' || state === 'error') && (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
