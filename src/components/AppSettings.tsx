import { memo, useState } from 'react';
import { Settings, Zap, Palette, Keyboard, Info, Gauge, Moon, Sun, Laptop, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { VaultSettings } from '@/components/VaultSettings';
import { cn } from '@/lib/utils';

interface SettingsProps {
  autoSaveDelay?: number;
  searchDelay?: number;
  onAutoSaveDelayChange?: (delay: number) => void;
  onSearchDelayChange?: (delay: number) => void;
  onVaultDeleted?: () => void;
}

export const AppSettings = memo(({
  autoSaveDelay = 500,
  searchDelay = 300,
  onAutoSaveDelayChange,
  onSearchDelayChange,
  onVaultDeleted,
}: SettingsProps) => {
  const [localAutoSaveDelay, setLocalAutoSaveDelay] = useState(autoSaveDelay);
  const [localSearchDelay, setLocalSearchDelay] = useState(searchDelay);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Customize your note-taking experience
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="vault" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="vault" className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vault</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Shortcuts</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">About</span>
            </TabsTrigger>
          </TabsList>

          {/* Vault Tab */}
          <TabsContent value="vault" className="mt-4">
            <VaultSettings onVaultDeleted={() => {
              setOpen(false);
              onVaultDeleted?.();
            }} />
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Search Delay</Label>
                    <p className="text-xs text-muted-foreground">
                      Delay before search executes while typing
                    </p>
                  </div>
                  <span className="text-sm font-mono text-primary">{localSearchDelay}ms</span>
                </div>
                <Slider
                  value={[localSearchDelay]}
                  onValueChange={(value) => {
                    setLocalSearchDelay(value[0]);
                    onSearchDelayChange?.(value[0]);
                  }}
                  min={100}
                  max={1000}
                  step={50}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Auto-save Delay</Label>
                    <p className="text-xs text-muted-foreground">
                      Delay before auto-saving after you stop typing
                    </p>
                  </div>
                  <span className="text-sm font-mono text-primary">{localAutoSaveDelay}ms</span>
                </div>
                <Slider
                  value={[localAutoSaveDelay]}
                  onValueChange={(value) => {
                    setLocalAutoSaveDelay(value[0]);
                    onAutoSaveDelayChange?.(value[0]);
                  }}
                  min={200}
                  max={2000}
                  step={100}
                  className="w-full"
                />
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-primary" />
                  Active Optimizations
                </h3>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium">Debounced Search</span>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium">Debounced Auto-save</span>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium">Virtual Scrolling</span>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                      Enabled
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium">React.memo Optimization</span>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-colors">
                    <Sun className="w-5 h-5 text-primary" />
                    <span className="text-xs font-medium">Light</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors">
                    <Moon className="w-5 h-5" />
                    <span className="text-xs font-medium">Dark</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors">
                    <Laptop className="w-5 h-5" />
                    <span className="text-xs font-medium">System</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Font Size</Label>
                    <p className="text-xs text-muted-foreground">
                      Adjust the default font size
                    </p>
                  </div>
                  <span className="text-sm font-mono text-primary">16px</span>
                </div>
                <Slider
                  defaultValue={[16]}
                  min={12}
                  max={24}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Show Table of Contents</Label>
                  <p className="text-xs text-muted-foreground">
                    Auto-show TOC for notes with headings
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Compact Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Reduce spacing for more content
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </TabsContent>

          {/* Keyboard Shortcuts Tab */}
          <TabsContent value="shortcuts" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Editor Shortcuts</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <span className="text-sm">Bold</span>
                  <kbd className="px-2 py-1 text-xs rounded bg-muted border border-border font-mono">
                    Ctrl + B
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <span className="text-sm">Italic</span>
                  <kbd className="px-2 py-1 text-xs rounded bg-muted border border-border font-mono">
                    Ctrl + I
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <span className="text-sm">Underline</span>
                  <kbd className="px-2 py-1 text-xs rounded bg-muted border border-border font-mono">
                    Ctrl + U
                  </kbd>
                </div>
              </div>

              <h3 className="text-sm font-medium pt-4">Navigation Shortcuts</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <span className="text-sm">New Note</span>
                  <kbd className="px-2 py-1 text-xs rounded bg-muted border border-border font-mono">
                    Ctrl + N
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <span className="text-sm">Search</span>
                  <kbd className="px-2 py-1 text-xs rounded bg-muted border border-border font-mono">
                    Ctrl + F
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <span className="text-sm">Toggle Sidebar</span>
                  <kbd className="px-2 py-1 text-xs rounded bg-muted border border-border font-mono">
                    Ctrl + \\
                  </kbd>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-4 mt-4">
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">H</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">HadesNotes</h3>
                <p className="text-sm text-muted-foreground">Version 1.0.0</p>
              </div>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                A powerful, fast, and beautiful note-taking application built with React, TypeScript, and TipTap.
              </p>
              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Built with</span>
                  <span className="font-medium">React + Vite + TypeScript</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">UI Components</span>
                  <span className="font-medium">shadcn/ui</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Editor</span>
                  <span className="font-medium">TipTap</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
});

AppSettings.displayName = 'AppSettings';
