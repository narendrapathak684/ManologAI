import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  User,
  Key,
  LogOut,
  ChevronLeft,
  LayoutDashboard,
  BookOpenText,
  CheckCircle2,
  ChartColumnBig,
  FolderKanban,
  AlertCircle,
  CheckCircle,
  Smartphone,
  Upload,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api, getApiErrorMessage } from "../lib/api";
import MobileTabBar from "../components/MobileTabBar";

const navItems = [
  { label: "Today", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Journal", icon: BookOpenText, to: "/journal" },
  { label: "Track", icon: CheckCircle2, to: "/track" },
  { label: "Analytics", icon: ChartColumnBig, to: "/analytics" },
  { label: "Organise", icon: FolderKanban, to: "/organise" },
  { label: "Profile", icon: User, to: "/profile", active: true },
];

const getProfilePictureUrl = (profilePicture) => {
  if (!profilePicture) {
    return "";
  }

  if (typeof profilePicture === "string") {
    return profilePicture;
  }

  return profilePicture.url || "";
};

export default function ProfilePage() {
  const { user, setUser, loading: authLoading, logout } = useAuth();
  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [status, setStatus] = useState({ type: null, message: "" });
  const [isResetting, setIsResetting] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });
  const [selectedProfilePicture, setSelectedProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState("");
  const [enlargedProfilePicture, setEnlargedProfilePicture] = useState("");
  const maxNameLength = 30;
  const [profileStatus, setProfileStatus] = useState({
    type: null,
    message: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isRemovingProfilePicture, setIsRemovingProfilePicture] =
    useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [installStatus, setInstallStatus] = useState({
    type: null,
    message: "",
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setInstallStatus({ type: null, message: "" });
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      setInstallStatus({
        type: "success",
        message: "App installed successfully.",
      });
    };

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsAppInstalled(isStandalone);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (profilePicturePreview) {
        URL.revokeObjectURL(profilePicturePreview);
      }
    };
  }, [profilePicturePreview]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsResetting(true);
    setStatus({ type: null, message: "" });
    try {
      await api.post("/profile/reset-password", passForm);
      setStatus({ type: "success", message: "Password reset successfully" });
      setPassForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setStatus({
        type: "error",
        message: getApiErrorMessage(err, "Failed to connect to server"),
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileStatus({ type: null, message: "" });
    if (profileForm.firstName.length > maxNameLength) {
      setProfileStatus({
        type: "error",
        message: `First name must be ${maxNameLength} characters or fewer`,
      });
      setIsSavingProfile(false);
      return;
    }
    if (profileForm.lastName.length > maxNameLength) {
      setProfileStatus({
        type: "error",
        message: `Last name must be ${maxNameLength} characters or fewer`,
      });
      setIsSavingProfile(false);
      return;
    }
    try {
      const res = await api.patch("/profile/me", profileForm);
      let updatedUser = res.data.user;

      if (selectedProfilePicture) {
        const formData = new FormData();
        formData.append("profilePicture", selectedProfilePicture);
        const pictureRes = await api.patch(
          "/profile/me/profile-picture",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
        updatedUser = pictureRes.data.user;
      }

      setProfileStatus({
        type: "success",
        message: "Profile updated successfully",
      });
      setUser(updatedUser); // update the global user context
      setSelectedProfilePicture(null);
      setProfilePicturePreview("");
      setIsEditingProfile(false);
    } catch (err) {
      setProfileStatus({
        type: "error",
        message: getApiErrorMessage(err, "Failed to update profile"),
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleProfilePictureChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (profilePicturePreview) {
      URL.revokeObjectURL(profilePicturePreview);
    }

    setSelectedProfilePicture(file);
    setProfilePicturePreview(URL.createObjectURL(file));
  };

  const handleRemoveProfilePicture = async () => {
    setIsRemovingProfilePicture(true);
    setProfileStatus({ type: null, message: "" });

    try {
      const res = await api.delete("/profile/me/profile-picture");
      setUser(res.data.user);
      setSelectedProfilePicture(null);
      setProfilePicturePreview("");
      setProfileStatus({
        type: "success",
        message: "Profile picture removed successfully",
      });
    } catch (err) {
      setProfileStatus({
        type: "error",
        message: getApiErrorMessage(err, "Failed to remove profile picture"),
      });
    } finally {
      setIsRemovingProfilePicture(false);
    }
  };

  const handleInstallApp = async () => {
    if (isAppInstalled) {
      setInstallStatus({
        type: "success",
        message: "App is already installed on this device.",
      });
      return;
    }

    if (!deferredPrompt) {
      const isAndroid = /Android/i.test(navigator.userAgent || "");
      setInstallStatus({
        type: "info",
        message: isAndroid
          ? "Install prompt not available. In Chrome, open the menu (three dots) and tap 'Add to Home screen'. Note: auto-install requires HTTPS and a PWA manifest."
          : "Install option not available. On iOS, tap Share and choose 'Add to Home Screen'.",
      });
      return;
    }

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult?.outcome === "accepted") {
      setInstallStatus({
        type: "success",
        message: "Install started. Follow the prompts to finish.",
      });
    } else {
      setInstallStatus({
        type: "error",
        message: "Install dismissed. You can try again anytime.",
      });
    }
    setDeferredPrompt(null);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white font-mono text-sm tracking-[0.3em] uppercase animate-pulse">
        Initialising Profile Hub...
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-slate-100 overflow-hidden relative">
      <div className="absolute top-0 inset-x-0 h-[800px] pointer-events-none">
        <div className="absolute left-[-10%] top-8 h-80 w-80 rounded-full bg-pink-600/10 blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/20 blur-[120px] rounded-full" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-600/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 h-full w-full">
        <main className="h-full overflow-y-auto p-4 pb-28 sm:p-6 sm:pb-32 lg:p-12 lg:pb-12">
          <div className="mx-auto max-w-3xl">
            <header className="mb-12">
              <Link
                to="/dashboard"
                className="inline-flex items-center text-sm text-slate-500 hover:text-pink-400 transition-colors mb-6 group"
              >
                <ChevronLeft className="mr-1 h-4 w-4 group-hover:-translate-x-1 transition-transform" />{" "}
                Back to Dashboard
              </Link>
              <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
                Account
              </h1>
              <p className="text-slate-400 text-lg">
                Manage your identity and security keys.
              </p>
            </header>

            <div className="space-y-8">
              {/* Profile Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-white/10 bg-slate-900/40 backdrop-blur-3xl overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <User className="w-32 h-32" />
                  </div>
                  <CardHeader className="flex flex-row items-center justify-between relative z-10">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <User className="h-5 w-5 text-pink-400" /> Identity
                      </CardTitle>
                      <CardDescription>
                        Your essential account details.
                      </CardDescription>
                    </div>
                    {!isEditingProfile && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setProfileForm({
                            firstName: user?.firstName || "",
                            lastName: user?.lastName || "",
                          });
                          setSelectedProfilePicture(null);
                          setProfilePicturePreview("");
                          setIsEditingProfile(true);
                          setProfileStatus({ type: null, message: "" });
                        }}
                        className="text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 text-sm"
                      >
                        Edit Profile
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6 relative z-10">
                    {/* Status Message for Profile Update */}
                    <AnimatePresence>
                      {profileStatus.message && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`flex items-center gap-2 p-4 rounded-xl text-sm ${
                            profileStatus.type === "success"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {profileStatus.type === "success" ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                          {profileStatus.message}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {isEditingProfile ? (
                      <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-black/30">
                            {profilePicturePreview ||
                            getProfilePictureUrl(user?.profilePicture) ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setEnlargedProfilePicture(
                                    profilePicturePreview ||
                                      getProfilePictureUrl(
                                        user?.profilePicture,
                                      ),
                                  )
                                }
                                className="h-full w-full"
                                aria-label="View profile picture"
                              >
                                <img
                                  src={
                                    profilePicturePreview ||
                                    getProfilePictureUrl(user?.profilePicture)
                                  }
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            ) : (
                              <User className="h-10 w-10 text-slate-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-slate-500">
                              Profile Picture
                            </label>
                            <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-white/10 bg-black/20 px-3 text-sm font-medium text-slate-200 transition-colors hover:border-pink-500/50 hover:text-white">
                              <Upload className="h-4 w-4 text-pink-400" />
                              {selectedProfilePicture
                                ? selectedProfilePicture.name
                                : "Choose image"}
                              <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={handleProfilePictureChange}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-slate-500">
                              First Name
                            </label>
                            <Input
                              className="bg-black/20 border-white/10 text-white h-11 focus:border-pink-500/50"
                              value={profileForm.firstName}
                              onChange={(e) =>
                                setProfileForm({
                                  ...profileForm,
                                  firstName: e.target.value,
                                })
                              }
                              maxLength={maxNameLength}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-slate-500">
                              Last Name
                            </label>
                            <Input
                              className="bg-black/20 border-white/10 text-white h-11 focus:border-pink-500/50"
                              value={profileForm.lastName}
                              onChange={(e) =>
                                setProfileForm({
                                  ...profileForm,
                                  lastName: e.target.value,
                                })
                              }
                              maxLength={maxNameLength}
                            />
                          </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-4">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setSelectedProfilePicture(null);
                              setProfilePicturePreview("");
                              setIsEditingProfile(false);
                            }}
                            className="text-slate-400 hover:text-white"
                            disabled={isSavingProfile}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="bg-pink-600 hover:bg-pink-500 text-white"
                            disabled={isSavingProfile}
                          >
                            {isSavingProfile ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-4 md:col-span-2 sm:flex-row sm:items-center">
                          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-black/30">
                            {getProfilePictureUrl(user?.profilePicture) ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setEnlargedProfilePicture(
                                    getProfilePictureUrl(user?.profilePicture),
                                  )
                                }
                                className="h-full w-full"
                                aria-label="View profile picture"
                              >
                                <img
                                  src={getProfilePictureUrl(
                                    user?.profilePicture,
                                  )}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            ) : (
                              <User className="h-10 w-10 text-slate-500" />
                            )}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
                              Profile Picture
                            </p>
                            <p className="text-sm text-slate-300">
                              {getProfilePictureUrl(user?.profilePicture)
                                ? "Photo added"
                                : "No picture set"}
                            </p>
                            {getProfilePictureUrl(user?.profilePicture) && (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={handleRemoveProfilePicture}
                                disabled={isRemovingProfilePicture}
                                className="mt-2 h-9 px-3 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {isRemovingProfilePicture
                                  ? "Removing..."
                                  : "Remove"}
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
                            First Name
                          </p>
                          <p className="text-lg font-medium text-white">
                            {user?.firstName || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
                            Last Name
                          </p>
                          <p className="text-lg font-medium text-white">
                            {user?.lastName || "—"}
                          </p>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
                            Email Address
                          </p>
                          <p className="text-lg font-medium text-white">
                            {user?.email || "—"}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Password Reset */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="mb-8 border-white/10 bg-slate-900/40 backdrop-blur-3xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-sky-400" />
                      Add to Home Screen
                    </CardTitle>
                    <CardDescription>
                      Install ManologAI for faster access like a native app.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {installStatus.message && (
                      <div
                        className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                          installStatus.type === "success"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                            : installStatus.type === "error"
                              ? "border-rose-500/20 bg-rose-500/10 text-rose-300"
                              : "border-sky-500/20 bg-sky-500/10 text-sky-200"
                        }`}
                      >
                        {installStatus.message}
                      </div>
                    )}
                    <Button
                      type="button"
                      onClick={handleInstallApp}
                      className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold h-12 rounded-xl transition-all shadow-lg shadow-sky-950/20 disabled:opacity-60"
                      disabled={isAppInstalled}
                    >
                      {isAppInstalled ? "App Installed" : "Add ManologAI"}
                    </Button>
                    <p className="text-xs text-slate-400">
                      iOS: Use Safari, tap Share, then "Add to Home Screen".
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-slate-900/40 backdrop-blur-3xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Key className="h-5 w-5 text-emerald-400" /> Security
                    </CardTitle>
                    <CardDescription>
                      Update your access credentials.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleResetPassword} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-slate-500">
                          Current Password
                        </label>
                        <Input
                          type="password"
                          className="bg-black/20 border-white/10 text-white h-12 focus:border-pink-500/50"
                          value={passForm.currentPassword}
                          onChange={(e) =>
                            setPassForm({
                              ...passForm,
                              currentPassword: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-slate-500">
                          New Password
                        </label>
                        <Input
                          type="password"
                          className="bg-black/20 border-white/10 text-white h-12 focus:border-emerald-500/50"
                          value={passForm.newPassword}
                          onChange={(e) =>
                            setPassForm({
                              ...passForm,
                              newPassword: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <AnimatePresence>
                        {status.message && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`flex items-center gap-2 p-4 rounded-xl text-sm ${
                              status.type === "success"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {status.type === "success" ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                            {status.message}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 rounded-xl transition-all shadow-lg shadow-emerald-950/20 disabled:opacity-50"
                        disabled={isResetting}
                      >
                        {isResetting
                          ? "Synchronising..."
                          : "Reset Security Keys"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Session Termination */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  onClick={logout}
                  variant="ghost"
                  className="w-full h-14 border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-2xl transition-all"
                >
                  <LogOut className="mr-2 h-5 w-5" /> Terminate Current Session
                </Button>
              </motion.div>
            </div>
          </div>
        </main>
      </div>

      <MobileTabBar items={navItems} />

      <AnimatePresence>
        {enlargedProfilePicture && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEnlargedProfilePicture("")}
          >
            <motion.div
              className="relative max-h-[86vh] w-full max-w-3xl"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setEnlargedProfilePicture("")}
                className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white transition hover:bg-white/10"
                aria-label="Close profile picture"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={enlargedProfilePicture}
                alt=""
                className="max-h-[86vh] w-full rounded-2xl object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
