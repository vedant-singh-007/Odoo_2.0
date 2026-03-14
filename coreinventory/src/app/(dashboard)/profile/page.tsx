"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, Calendar, Save, Phone } from "lucide-react";
import { format } from "date-fns";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setName(data.name);
        setPhone(data.phone || "");
      }
    } catch {
      // fallback to session data
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const user = session?.user as { id?: string; name?: string; email?: string; role?: string } | undefined;

  const handleUpdateProfile = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setSuccess("Profile updated successfully");
        setProfile(data);
        await update();
      }
    } catch {
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwSaving(true);
    setPwError("");
    setPwSuccess("");

    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters");
      setPwSaving(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match");
      setPwSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error);
      } else {
        setPwSuccess("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPwError("Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  const hasProfileChanges = name !== (profile?.name || "") || phone !== (profile?.phone || "");

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 border-4 border-[hsl(280,30%,35%)]/20 border-t-[hsl(280,30%,35%)] rounded-full animate-spin" />
          <span className="text-lg text-gray-500">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your account details</p>
      </div>

      {/* Profile Info Card */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-[hsl(280,30%,35%)]" />
            Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}
          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{success}</div>
          )}

          <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[hsl(280,30%,35%)] to-[hsl(280,30%,50%)] flex items-center justify-center text-white text-xl font-bold">
              {(profile?.name || user?.name)?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-semibold text-lg">{profile?.name || user?.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-sm text-gray-500">{profile?.email || user?.email}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="h-3.5 w-3.5 text-gray-400" />
                <Badge className="bg-[hsl(280,30%,35%)] text-white text-xs">
                  {(profile?.role || user?.role) === "MANAGER" ? "Inventory Manager" : "Warehouse Staff"}
                </Badge>
              </div>
              {profile?.createdAt && (
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-400">
                    Member since {format(new Date(profile.createdAt), "MMMM dd, yyyy")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-name">Full Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="profile-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 99999 99999"
                className="h-11 pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={profile?.email || user?.email || ""}
              disabled
              className="h-11 bg-gray-50"
            />
            <p className="text-xs text-gray-400">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Input
              value={(profile?.role || user?.role) === "MANAGER" ? "Inventory Manager" : "Warehouse Staff"}
              disabled
              className="h-11 bg-gray-50"
            />
            <p className="text-xs text-gray-400">Role is assigned by system administrator</p>
          </div>

          <Button
            onClick={handleUpdateProfile}
            disabled={saving || !hasProfileChanges}
            className="bg-[hsl(280,30%,35%)] hover:bg-[hsl(280,30%,30%)]"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Update Profile"}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-[hsl(280,30%,35%)]" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pwError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{pwError}</div>
          )}
          {pwSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{pwSuccess}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-new-password">Confirm New Password</Label>
            <Input
              id="confirm-new-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="h-11"
            />
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={pwSaving || !currentPassword || !newPassword}
            className="bg-[hsl(280,30%,35%)] hover:bg-[hsl(280,30%,30%)]"
          >
            {pwSaving ? "Changing..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
