import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { fetchProfile, updateProfile } from "@/lib/database";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Camera, Loader2, Save, User, GraduationCap, Phone, BookOpen } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Postgraduate", "Other"];

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [institution, setInstitution] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id).then((p: any) => {
      if (p) {
        setDisplayName(p.display_name || "");
        setAvatarUrl(p.avatar_url);
        setCourse(p.course || "");
        setYear(p.year || "");
        setInstitution(p.institution || "");
        setBio(p.bio || "");
        setPhone(p.phone || "");
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
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
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
      await updateProfile(user.id, {
        display_name: displayName.trim() || null,
        course: course.trim() || null,
        year: year || null,
        institution: institution.trim() || null,
        bio: bio.trim() || null,
        phone: phone.trim() || null,
      });
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
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50 px-8 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">Profile Settings</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-10 space-y-8 animate-fade-in">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <Avatar className="h-24 w-24 ring-4 ring-primary/20 ring-offset-4 ring-offset-background">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
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
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <p className="text-xs text-muted-foreground">Click to upload (max 2MB)</p>
        </div>

        {/* Personal Info */}
        <div className="bg-card rounded-2xl p-6 shadow-[var(--shadow-soft)] space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border/50">
            <User className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-sm text-foreground">Personal Info</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="display-name" className="text-xs font-semibold">Full Name</Label>
              <Input id="display-name" placeholder="Your full name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={100} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Email</Label>
              <Input value={user?.email || ""} disabled className="rounded-xl opacity-60" />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="phone" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} className="rounded-xl pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-xs font-semibold">Bio</Label>
              <Textarea id="bio" placeholder="Tell us a bit about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} rows={3} className="rounded-xl resize-none" />
              <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
            </div>
          </div>
        </div>

        {/* Academic Info */}
        <div className="bg-card rounded-2xl p-6 shadow-[var(--shadow-soft)] space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border/50">
            <GraduationCap className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-sm text-foreground">Academic Info</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="institution" className="text-xs font-semibold">Institution / University</Label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="institution" placeholder="e.g. MIT, Stanford, IIT Delhi" value={institution} onChange={(e) => setInstitution(e.target.value)} maxLength={150} className="rounded-xl pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course" className="text-xs font-semibold">Course / Major</Label>
              <Input id="course" placeholder="e.g. Computer Science, Medicine" value={course} onChange={(e) => setCourse(e.target.value)} maxLength={150} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Year of Study</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select your year" />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Save */}
        <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl bg-primary hover:bg-primary/90 h-11">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default Profile;
