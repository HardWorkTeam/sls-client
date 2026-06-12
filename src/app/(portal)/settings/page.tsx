"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePassword, useUpdateProfile } from "@/hooks/use-auth";
import { apiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
}

interface PasswordForm {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const profileForm = useForm<ProfileForm>({
    values: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    defaultValues: { current_password: "", password: "", password_confirmation: "" },
  });

  const onProfileSubmit = profileForm.handleSubmit(async (values) => {
    setProfileMessage(null);
    try {
      await updateProfile.mutateAsync({
        name: values.name,
        email: values.email,
        phone: values.phone || null,
      });
      setProfileMessage("Profile updated.");
    } catch (error) {
      setProfileMessage(apiErrorMessage(error));
    }
  });

  const onPasswordSubmit = passwordForm.handleSubmit(async (values) => {
    setPasswordMessage(null);
    try {
      await changePassword.mutateAsync(values);
      passwordForm.reset();
      setPasswordMessage("Password changed.");
    } catch (error) {
      setPasswordMessage(apiErrorMessage(error));
    }
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-500">Manage your profile and security.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onProfileSubmit} className="space-y-3">
            <div>
              <Label htmlFor="profile-name">Name</Label>
              <Input id="profile-name" {...profileForm.register("name", { required: true })} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  {...profileForm.register("email", { required: true })}
                />
              </div>
              <div>
                <Label htmlFor="profile-phone">Phone</Label>
                <Input id="profile-phone" {...profileForm.register("phone")} />
              </div>
            </div>
            {profileMessage ? (
              <p className="text-sm text-emerald-700">{profileMessage}</p>
            ) : null}
            <Button type="submit" disabled={updateProfile.isPending}>
              Save Profile
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Other sessions are logged out when the password changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onPasswordSubmit} className="space-y-3">
            <div>
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                {...passwordForm.register("current_password", { required: true })}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  {...passwordForm.register("password", { required: true, minLength: 8 })}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  {...passwordForm.register("password_confirmation", { required: true })}
                />
              </div>
            </div>
            {passwordMessage ? (
              <p className="text-sm text-emerald-700">{passwordMessage}</p>
            ) : null}
            <Button type="submit" disabled={changePassword.isPending}>
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
