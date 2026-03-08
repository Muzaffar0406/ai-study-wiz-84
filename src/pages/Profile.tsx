import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { fetchProfile, updateProfile } from "@/lib/database";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Camera, Loader2, Save, User } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id).then((p) => {
      if (p) {
        setDisplayName(p.display_name || "");
        setAvatarUrl(p.avatar_url);
      }
      setLoaded(true);
    });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB allowed.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const urlWithBust = `${publicUrl}?t=${Date.now()}`;
    setAvatarUrl(urlWithBust);

    try {
      await updateProfile(user.id, { avatar_url: urlWithBust });
      toast({ title: "Avatar updated ✨" });
    } catch {
      toast({ title: "Error", description: "Could not save avatar.", variant: "destructive" });
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, { display_name: displayName.trim() || null });
      toast({ title: "Profile saved ✅" });
    } catch {
      toast({ title: "Error", description: "Could not save profile.", variant: "destructive" });
    }
    setSaving(false);
  };

  const initials = (displayName || user?.email?.split("@")[0] || "U").charAt(0).toUpperCase();

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 border-b">
        <div className="container mx-auto px-6 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Profile Settings</h1>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10 max-w-lg space-y-8 animate-fade-in">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <Avatar className="h-28 w-28 ring-4 ring-primary/20 ring-offset-4 ring-offset-background">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-3xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/0 group-hover:bg-foreground/40 transition-colors cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" />
              ) : (
                <Camera className="h-6 w-6 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <p className="text-xs text-muted-foreground">Click to upload a new photo (max 2MB)</p>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-border/50">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-bold text-foreground">Personal Info</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name" className="text-sm font-medium">Display Name</Label>
              <Input
                id="display-name"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={100}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <Input
                value={user?.email || ""}
                disabled
                className="rounded-xl opacity-60"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-glow hover:shadow-[0_8px_30px_hsl(var(--primary)/0.3)] transition-all"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;