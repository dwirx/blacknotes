import { memo } from 'react';
import { Settings, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface PerformanceSettingsProps {
  autoSaveDelay?: number;
  searchDelay?: number;
  onAutoSaveDelayChange?: (delay: number) => void;
  onSearchDelayChange?: (delay: number) => void;
}

export const PerformanceSettings = memo(({
  autoSaveDelay = 500,
  searchDelay = 300,
  onAutoSaveDelayChange,
  onSearchDelayChange,
}: PerformanceSettingsProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
          title="Performance Settings"
        >
          <Zap className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Performance Settings
          </DialogTitle>
          <DialogDescription>
            Configure performance optimizations for a smoother experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Performance Indicators */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Active Optimizations</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">Debounced Search</span>
                </div>
                <span className="text-xs text-muted-foreground">{searchDelay}ms</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">Debounced Auto-save</span>
                </div>
                <span className="text-xs text-muted-foreground">{autoSaveDelay}ms</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">Virtual Scrolling</span>
                </div>
                <span className="text-xs text-muted-foreground">Enabled</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">React.memo Optimization</span>
                </div>
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
            </div>
          </div>

          {/* Performance Tips */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Performance Tips</h3>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Search is optimized with {searchDelay}ms delay</li>
              <li>Editor auto-saves every {autoSaveDelay}ms after you stop typing</li>
              <li>Large note lists use virtual scrolling for speed</li>
              <li>Table of Contents updates are optimized</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

PerformanceSettings.displayName = 'PerformanceSettings';
