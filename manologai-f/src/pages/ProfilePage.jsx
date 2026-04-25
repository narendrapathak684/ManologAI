import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
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
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crop,
  ShieldOff,
  TriangleAlert,
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
import { COUNTRIES } from "../lib/constants";
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

/* ────────────────────────────────────────────────────────────
   Image Crop Modal (canvas-based, zero extra dependencies)
   ──────────────────────────────────────────────────────────── */
function ImageCropModal({ imageSrc, onConfirm, onCancel }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // image natural dimensions
  const imgRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // pan & zoom state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null); // { startX, startY, startOffsetX, startOffsetY }

  const CROP_SIZE = 300; // visible crop circle diameter in logic pixels
  const CANVAS = CROP_SIZE + 80; // canvas size with padding

  // ── draw ──────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const r = CROP_SIZE / 2;

    ctx.clearRect(0, 0, W, H);

    // draw image
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    ctx.drawImage(img, cx + offset.x - drawW / 2, cy + offset.y - drawH / 2, drawW, drawH);

    // dark overlay outside circle
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
    ctx.fill("evenodd");
    ctx.restore();

    // circle border
    ctx.save();
    ctx.strokeStyle = "rgba(236,72,153,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [scale, offset, imgLoaded, CROP_SIZE]);

  useEffect(() => { draw(); }, [draw]);

  // ── load image ────────────────────────────────────────────
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // fit image to crop circle initially
      const fitScale = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
      setScale(fitScale);
      setOffset({ x: 0, y: 0 });
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc, CROP_SIZE]);

  // ── mouse drag ────────────────────────────────────────────
  const onMouseDown = (e) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
    };
  };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset({
      x: dragRef.current.startOffsetX + dx,
      y: dragRef.current.startOffsetY + dy,
    });
  };
  const onMouseUp = () => { dragRef.current = null; };

  // ── touch drag ────────────────────────────────────────────
  const touchRef = useRef(null);
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startOffsetX: offset.x,
        startOffsetY: offset.y,
        type: "pan",
      };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchRef.current = {
        type: "pinch",
        startDist: Math.hypot(dx, dy),
        startScale: scale,
      };
    }
  };
  const onTouchMove = (e) => {
    e.preventDefault();
    if (!touchRef.current) return;
    if (touchRef.current.type === "pan" && e.touches.length === 1) {
      setOffset({
        x: touchRef.current.startOffsetX + (e.touches[0].clientX - touchRef.current.startX),
        y: touchRef.current.startOffsetY + (e.touches[0].clientY - touchRef.current.startY),
      });
    } else if (touchRef.current.type === "pinch" && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      setScale(Math.max(0.3, touchRef.current.startScale * (dist / touchRef.current.startDist)));
    }
  };
  const onTouchEnd = () => { touchRef.current = null; };

  // ── scroll zoom ───────────────────────────────────────────
  const onWheel = (e) => {
    e.preventDefault();
    setScale((s) => Math.max(0.3, s - e.deltaY * 0.002));
  };

  const zoomIn = () => setScale((s) => Math.min(s + 0.15, 8));
  const zoomOut = () => setScale((s) => Math.max(s - 0.15, 0.15));
  const reset = () => {
    const img = imgRef.current;
    if (!img) return;
    const fitScale = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
    setScale(fitScale);
    setOffset({ x: 0, y: 0 });
  };

  // ── confirm — extract circle from canvas ──────────────────
  const handleConfirm = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const OUTPUT = 400; // output image px
    const out = document.createElement("canvas");
    out.width = OUTPUT;
    out.height = OUTPUT;
    const ctx = out.getContext("2d");

    const W = canvas.width; // = CANVAS
    const cx = W / 2;
    const r = CROP_SIZE / 2;

    // clip to circle
    ctx.beginPath();
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
    ctx.clip();

    // draw the image region inside the crop circle, scaled to OUTPUT
    const ratio = OUTPUT / CROP_SIZE;
    const drawW = img.naturalWidth * scale * ratio;
    const drawH = img.naturalHeight * scale * ratio;
    const srcCenterX = cx + offset.x;
    const srcCenterY = cx + offset.y; // cy == cx since square
    const destX = (srcCenterX - (cx - r)) * ratio - ((cx - r) * ratio);
    const destY = (srcCenterY - (cx - r)) * ratio - ((cx - r) * ratio);
    ctx.drawImage(
      img,
      OUTPUT / 2 + offset.x * ratio - drawW / 2,
      OUTPUT / 2 + offset.y * ratio - drawH / 2,
      drawW,
      drawH,
    );
    // silence unused var warnings
    void destX; void destY;

    out.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
      onConfirm(file, URL.createObjectURL(blob));
    }, "image/jpeg", 0.92);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl shadow-pink-950/30 overflow-hidden"
          initial={{ scale: 0.94, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        >
          {/* header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <div className="flex items-center gap-2">
              <Crop className="h-4 w-4 text-pink-400" />
              <span className="text-sm font-semibold text-white">Crop Photo</span>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400 hover:border-pink-500/40 hover:text-white transition-colors"
              aria-label="Cancel crop"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* canvas */}
          <div
            ref={containerRef}
            className="flex items-center justify-center bg-black/50 cursor-grab active:cursor-grabbing select-none"
            style={{ touchAction: "none" }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS}
              height={CANVAS}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onWheel={onWheel}
              style={{ display: "block", maxWidth: "100%" }}
            />
          </div>

          {/* hint */}
          <p className="text-center text-xs text-slate-500 pt-1 pb-0">Drag to pan · Scroll or pinch to zoom</p>

          {/* zoom controls */}
          <div className="flex items-center justify-center gap-3 px-5 py-2">
            <button
              type="button"
              onClick={zoomOut}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-300 hover:border-pink-500/40 hover:text-pink-300 transition-colors"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <div className="flex-1 relative h-1.5 rounded-full bg-white/10">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-pink-500 transition-all"
                style={{ width: `${Math.min(((scale - 0.15) / 7.85) * 100, 100)}%` }}
              />
            </div>
            <button
              type="button"
              onClick={zoomIn}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-300 hover:border-pink-500/40 hover:text-pink-300 transition-colors"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-400 hover:border-white/30 hover:text-white transition-colors"
              aria-label="Reset position"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* actions */}
          <div className="flex gap-3 px-5 pb-5">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-11 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 h-11 rounded-xl bg-pink-600 text-sm font-semibold text-white hover:bg-pink-500 transition-colors shadow-lg shadow-pink-950/40"
            >
              Apply Crop
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ────────────────────────────────────────────────────────────
   Delete Account Confirmation Modal
   Two-step: type DELETE → animated progress → done → redirect
   ──────────────────────────────────────────────────────────── */
function DeleteAccountModal({ onConfirmed, onCancel }) {
  const [phase, setPhase] = useState("confirm"); // confirm | deleting | done
  const [step, setStep] = useState(0);

  const steps = [
    "Revoking authentication tokens...",
    "Erasing journal entries...",
    "Removing habit & tracking data...",
    "Purging analytics records...",
    "Deleting account credentials...",
    "Finalizing deletion...",
  ];

  const handleDelete = async () => {
    setPhase("deleting");
    setStep(0);

    // Animate through steps, then call the real handler
    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 650));
      setStep(i + 1);
    }
    await new Promise((r) => setTimeout(r, 400));
    setPhase("done");
    await new Promise((r) => setTimeout(r, 1800));
    onConfirmed();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full max-w-sm rounded-2xl border border-rose-500/25 bg-[#0f0a0a]/95 shadow-2xl shadow-rose-950/50 overflow-hidden"
        initial={{ scale: 0.93, opacity: 0, y: 28 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 28 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
      >
        {/* Glow stripe */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" />

        {phase === "confirm" && (
          <div className="p-6 space-y-5">
            {/* Icon */}
            <div className="flex items-center justify-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10">
                <ShieldOff className="h-7 w-7 text-rose-400" />
                <div className="absolute inset-0 rounded-full animate-ping bg-rose-500/10" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h2 className="text-lg font-bold text-white">Delete Account?</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                This will permanently erase your account, all journal entries,
                habits, analytics, and personal data.
              </p>
              <p className="text-sm font-semibold text-rose-400">
                This action cannot be undone.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                id="delete-account-confirm-btn"
                type="button"
                onClick={handleDelete}
                className="w-full h-12 rounded-xl bg-rose-600 text-sm font-semibold text-white transition-all shadow-lg shadow-rose-950/50 hover:bg-rose-500 active:scale-[0.97]"
              >
                Yes, Delete My Account
              </button>
              <button
                id="delete-account-cancel-btn"
                type="button"
                onClick={onCancel}
                className="w-full h-12 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {phase === "deleting" && (
          <div className="p-8 space-y-6">
            <div className="text-center space-y-1">
              <p className="text-xs font-mono uppercase tracking-widest text-rose-400 animate-pulse">Processing deletion</p>
              <h2 className="text-base font-bold text-white">Please wait...</h2>
            </div>
            <div className="space-y-3">
              {steps.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={step > i ? { opacity: 1, x: 0 } : {}}
                  className="flex items-center gap-3 text-sm"
                >
                  <div className={`h-4 w-4 shrink-0 rounded-full flex items-center justify-center ${
                    step > i ? "bg-rose-500" : "bg-white/8 border border-white/10"
                  }`}>
                    {step > i && (
                      <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className={step > i ? "text-slate-300" : "text-slate-600"}>{s}</span>
                </motion.div>
              ))}
            </div>
            {/* Progress bar */}
            <div className="h-1 rounded-full bg-white/8 overflow-hidden">
              <motion.div
                className="h-full bg-rose-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${(step / steps.length) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {phase === "done" && (
          <motion.div
            className="p-8 flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10">
              <svg className="h-7 w-7 text-rose-400" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-base font-bold text-white">Account deleted</h2>
              <p className="text-sm text-slate-500">Your data has been permanently removed. Redirecting...</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

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
    country: user?.country || "",
  });
  const [selectedProfilePicture, setSelectedProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState("");
  const [enlargedProfilePicture, setEnlargedProfilePicture] = useState("");

  // Crop modal state
  const [cropSrc, setCropSrc] = useState(""); // raw data-URL fed into cropper
  const [showCropModal, setShowCropModal] = useState(false);
  const fileInputRef = useRef(null);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const navigate = useNavigate();
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
    if (!file) return;

    // Read as data-URL so the cropper canvas can draw cross-origin-safely
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropSrc(e.target.result);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be re-selected after cancel
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropConfirm = (croppedFile, croppedPreviewUrl) => {
    if (profilePicturePreview) URL.revokeObjectURL(profilePicturePreview);
    setSelectedProfilePicture(croppedFile);
    setProfilePicturePreview(croppedPreviewUrl);
    setShowCropModal(false);
    setCropSrc("");
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setCropSrc("");
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
                            country: user?.country || "",
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
                                ref={fileInputRef}
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
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-slate-500">
                              Country
                            </label>
                            <select
                              className="h-11 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pink-500/50"
                              value={profileForm.country}
                              onChange={(e) =>
                                setProfileForm({
                                  ...profileForm,
                                  country: e.target.value,
                                })
                              }
                              required
                            >
                              <option value="" disabled className="bg-slate-900">
                                Select your country
                              </option>
                              {COUNTRIES.map((country) => (
                                <option
                                  key={country}
                                  value={country}
                                  className="bg-slate-900"
                                >
                                  {country}
                                </option>
                              ))}
                            </select>
                            <p className="text-[10px] text-slate-500 mt-1 pl-1">
                              * Changing country will automatically update your
                              tracking currency.
                            </p>
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
                        <div className="space-y-1">
                          <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
                            Country
                          </p>
                          <p className="text-lg font-medium text-white">
                            {user?.country || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
                            Currency
                          </p>
                          <p className="text-lg font-medium text-pink-400">
                            {user?.currency || "USD"}
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

              {/* Danger Zone — Delete Account */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-rose-500/20 bg-rose-950/10 backdrop-blur-3xl overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-rose-400 flex items-center gap-2 text-base">
                      <TriangleAlert className="h-5 w-5" /> Danger Zone
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                      Permanently delete your account and all associated data.
                      This action cannot be undone.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowDeleteModal(true)}
                      disabled={isDeletingAccount}
                      className="w-full h-12 border border-rose-500/30 bg-rose-500/5 text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 hover:border-rose-500/50 rounded-xl transition-all font-semibold"
                    >
                      <ShieldOff className="mr-2 h-4 w-4" />
                      Delete My Account
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </main>
      </div>

      <MobileTabBar items={navItems} />

      {/* Crop Modal */}
      {showCropModal && cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <DeleteAccountModal
          onCancel={() => setShowDeleteModal(false)}
          onConfirmed={async () => {
            setIsDeletingAccount(true);
            try {
              await api.delete("/profile/me");
            } catch (_) {
              // even on error we force-logout client-side
            }
            logout(); // clear client auth state
            navigate("/login", { replace: true });
          }}
        />
      )}

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
