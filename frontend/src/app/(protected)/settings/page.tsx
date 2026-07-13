"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch, RootState } from "@/store/store";
import { updateUsername, verifyEmailUpdate, updatePassword, clearError, getCurrentUser, logoutUser } from "@/features/auth/authSlice";
import { checkUsernameAPI, initiateEmailUpdateAPI } from "@/features/auth/authApi";
import toast from "react-hot-toast";
import { Eye, EyeOff, Edit2, X, Check, Loader2 } from "lucide-react";
import OTPInput from "@/components/OTPInput";
import DeleteAccountModal from "@/components/DeleteAccountModal";

// Shared aesthetic styles
const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, color: "#7a5a22", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.3rem" };
const inputStyle: React.CSSProperties = { width: "100%", background: "transparent", border: "none", borderBottom: "1.5px solid rgba(80,45,10,0.45)", borderRadius: 0, padding: "0.3rem 0.1rem 0.4rem", fontSize: 17, color: "#1c0f02", outline: "none" };
const buttonBase: React.CSSProperties = { padding: "0.4rem 0.8rem", background: "transparent", border: "1.5px solid rgba(80,40,10,0.5)", borderRadius: 2, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3a1f05", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem" };

export default function Settings() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, loading, error } = useSelector((state: RootState) => state.auth);

  // States for Username
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // States for Email
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailPasswordInput, setEmailPasswordInput] = useState("");
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [isEmailInitiating, setIsEmailInitiating] = useState(false);
  
  // OTP Modal
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));

  // States for Password
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States for delete account modal
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);

  // Fetch fresh user data on mount to avoid stale data after login switch
  useEffect(() => {
      dispatch(getCurrentUser());
  }, [dispatch]);

  // Debounce effect for username check
  useEffect(() => {
    if (!isEditingUsername || !usernameInput) {
        setUsernameAvailable(null);
        setIsCheckingUsername(false);
        return;
    }
    const timer = setTimeout(async () => {
        setIsCheckingUsername(true);
        try {
            const res = await checkUsernameAPI(usernameInput);
            setUsernameAvailable(res.available);
        } catch {
            setUsernameAvailable(false);
        } finally {
            setIsCheckingUsername(false);
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [usernameInput, isEditingUsername]);

  useEffect(() => {
      if (error) {
          toast.error(typeof error === 'string' ? error : error.message || "An error occurred");
          dispatch(clearError());
      }
  }, [error, dispatch]);

  const handleCancelUsername = () => {
      setIsEditingUsername(false);
      setUsernameInput("");
      setUsernameAvailable(null);
  }

  const handleSaveUsername = async () => {
      if (!usernameAvailable || !usernameInput) return;
      const res = await dispatch(updateUsername({ username: usernameInput }));
      if (updateUsername.fulfilled.match(res)) {
          toast.success("Identity Code updated.");
          setIsEditingUsername(false);
      }
  }

  const handleCancelEmail = () => {
      setIsEditingEmail(false);
      setEmailInput("");
      setEmailPasswordInput("");
  }

  const handleInitiateEmail = async () => {
      if (!emailInput || !emailPasswordInput) return;
      setIsEmailInitiating(true);
      try {
          const res = await initiateEmailUpdateAPI({ newEmail: emailInput, password: emailPasswordInput });
          if (res.success) {
              setPendingEmail(res.email);
              setShowOtpModal(true);
              handleCancelEmail();
              toast.success("OTP sent to new address.");
          }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
          toast.error(err.response?.data?.message || err.message || "Failed to initiate update");
      } finally {
          setIsEmailInitiating(false);
      }
  }

  const handleVerifyEmail = async () => {
      const otp = otpDigits.join("");
      if (otp.length < 6) return toast.error("Enter complete code");
      const res = await dispatch(verifyEmailUpdate({ otp }));
      if (verifyEmailUpdate.fulfilled.match(res)) {
          toast.success("Correspondent's Address updated.");
          setShowOtpModal(false);
          setOtpDigits(Array(6).fill(""));
          setPendingEmail("");
      }
  }

  const handleCancelPassword = () => {
      setIsEditingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
  }

  const handleSavePassword = async () => {
      if (newPassword !== confirmPassword) {
          return toast.error("New passwords do not match.");
      }
      if (newPassword.length < 8) {
          return toast.error("Passphrase must be at least 8 characters.");
      }
      if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
          return toast.error("Passphrase must contain at least one Capital letter and one number.");
      }
      if (currentPassword === newPassword) {
          return toast.error("New passphrase must be different.");
      }
      const res = await dispatch(updatePassword({ currentPassword, newPassword }));
      if (updatePassword.fulfilled.match(res)) {
          toast.success("Secret Passphrase updated.");
          handleCancelPassword();
      }
  }

  const handleAccountDeleted = async () => {
      // Dispatch logout to wipe Redux auth state (access token, user)
      await dispatch(logoutUser());
      toast.success("Your account has been permanently deleted.", { duration: 5000 });
      router.push("/login");
  }

  if (!user) return null;

  return (
        <div
            className="relative min-h-screen flex items-start sm:items-center justify-center p-3 sm:p-8 overflow-x-hidden overflow-y-auto font-crimson"
            style={{ backgroundColor: "#1a0f00" }}
        >
            {/* Ruled lines overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(180deg, transparent, transparent 31px, rgba(80,50,10,0.08) 31px, rgba(80,50,10,0.08) 32px)",
                }}
            />

            {/* Corner flourishes */}
            {(["tl", "tr", "bl", "br"] as const).map((pos) => (
                <span
                    key={pos}
                    className="absolute text-7xl select-none pointer-events-none font-im-fell"
                    style={{
                        color: "#c8a96e",
                        opacity: 0.18,
                        top: pos.startsWith("t") ? "1.5rem" : "auto",
                        bottom: pos.startsWith("b") ? "1.5rem" : "auto",
                        left: pos.endsWith("l") ? "1.5rem" : "auto",
                        right: pos.endsWith("r") ? "1.5rem" : "auto",
                        transform: pos === "tr" ? "scaleX(-1)" : pos === "bl" ? "scaleY(-1)" : pos === "br" ? "scale(-1)" : "none",
                    }}
                >
                    ❧
                </span>
            ))}

            {/* Notebook card */}
            <div className="relative w-full max-w-2xl my-8">
                {/* Spiral binding */}
                <div
                    className="absolute left-2 sm:left-11 top-0 bottom-0 w-6 z-10 flex flex-col justify-around items-center"
                    style={{
                        background: "#2a1800",
                        borderLeft: "2px solid #3d2200",
                        borderRight: "2px solid #1a0d00",
                        padding: "1rem 0"
                    }}
                >
                    {Array.from({ length: 30 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-full my-1"
                            style={{
                                width: 14,
                                height: 14,
                                background: "#110900",
                                border: "1.5px solid #4a2e00",
                                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.8)",
                            }}
                        />
                    ))}
                </div>

                {/* Page */}
                <div
                    className="relative ml-2 sm:ml-11 rounded-r py-8 pr-5 pl-12 sm:py-12 sm:pr-10 sm:pl-16"
                    style={{
                        background: "linear-gradient(180deg, #f2e4b5 0%, #f5e9c8 30%, #f0e2b8 60%, #ede0b4 100%)",
                        boxShadow: "-4px 0 12px rgba(0,0,0,0.4), 4px 4px 20px rgba(0,0,0,0.5)",
                        minHeight: "600px",
                    }}
                >
                    {/* Inner ruled lines */}
                    <div
                        className="absolute inset-0 pointer-events-none rounded-r"
                        style={{
                            backgroundImage:
                                "repeating-linear-gradient(180deg, transparent, transparent 31px, rgba(100,60,10,0.12) 31px, rgba(100,60,10,0.12) 32px)",
                        }}
                    />

                    {/* Red margin line */}
                    <div
                        className="absolute top-0 bottom-0 left-8 sm:left-[52px]"
                        style={{ width: 1.5, background: "rgba(180,40,30,0.35)" }}
                    />

                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="font-special-elite" style={{ fontSize: 11, color: "#6b4c1e", letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.7, marginBottom: "0.4rem" }}>
                                Personal Dossier
                            </p>
                            <h1 className="font-im-fell" style={{ fontSize: 26, color: "#2c1a06", fontStyle: "italic", lineHeight: 1.2 }}>
                                Author&apos;s Profile
                            </h1>
                        </div>
                    </div>

                    <hr style={{ border: "none", borderTop: "1px solid rgba(100,65,15,0.3)", marginBottom: "2rem" }} />

                    <div className="space-y-10 relative z-10">
                        {/* --- USERNAME SECTION --- */}
                        <section>
                            <div className="flex justify-between items-end mb-2">
                                <label className="font-special-elite" style={labelStyle}>Identity Code</label>
                                {!isEditingUsername && (
                                    <button onClick={() => { setIsEditingUsername(true); setUsernameInput(user.username); }} className="text-[#7a5a22] hover:text-[#502d0a] transition-colors p-1">
                                        <Edit2 size={16} />
                                    </button>
                                )}
                            </div>
                            
                            {!isEditingUsername ? (
                                <p className="font-crimson text-xl text-[#1c0f02] border-b-[1.5px] border-transparent px-1 pb-1 animate-fade-in">{user.username}</p>
                            ) : (
                                <div className="space-y-4 p-4 border border-[rgba(80,45,10,0.2)] rounded bg-[rgba(255,255,255,0.3)] shadow-inner animate-fade-in">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={usernameInput}
                                            onChange={(e) => setUsernameInput(e.target.value)}
                                            style={{...inputStyle, paddingRight: '2rem'}}
                                            className="font-crimson"
                                            placeholder="New Identity Code"
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                            {isCheckingUsername && <Loader2 size={16} className="animate-spin text-[#7a5a22]" />}
                                            {!isCheckingUsername && usernameAvailable === true && usernameInput.length >= 3 && <Check size={16} className="text-green-600" />}
                                            {!isCheckingUsername && usernameAvailable === false && <X size={16} className="text-red-600" />}
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={handleSaveUsername} 
                                            disabled={loading || !usernameAvailable || usernameInput.length < 3 || isCheckingUsername} 
                                            style={{...buttonBase, opacity: (loading || !usernameAvailable || usernameInput.length < 3 || isCheckingUsername) ? 0.5 : 1}} 
                                            className="font-special-elite hover:bg-[rgba(80,40,10,0.05)] transition-colors"
                                        >
                                            {loading ? "Saving..." : "Save"}
                                        </button>
                                        <button onClick={handleCancelUsername} style={buttonBase} className="font-special-elite hover:bg-[rgba(80,40,10,0.05)] transition-colors">Cancel</button>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* --- EMAIL SECTION --- */}
                        <section>
                            <div className="flex justify-between items-end mb-2">
                                <label className="font-special-elite" style={labelStyle}>Correspondent&apos;s Address</label>
                                {!isEditingEmail && (
                                    <button onClick={() => setIsEditingEmail(true)} className="text-[#7a5a22] hover:text-[#502d0a] transition-colors p-1">
                                        <Edit2 size={16} />
                                    </button>
                                )}
                            </div>
                            
                            {!isEditingEmail ? (
                                <p className="font-crimson text-xl text-[#1c0f02] border-b-[1.5px] border-transparent px-1 pb-1 animate-fade-in">{user.email}</p>
                            ) : (
                                <div className="space-y-5 p-4 border border-[rgba(80,45,10,0.2)] rounded bg-[rgba(255,255,255,0.3)] shadow-inner animate-fade-in">
                                    <div>
                                        <input
                                            type="email"
                                            value={emailInput}
                                            onChange={(e) => setEmailInput(e.target.value)}
                                            style={inputStyle}
                                            className="font-crimson"
                                            placeholder="New Address"
                                        />
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showEmailPassword ? "text" : "password"}
                                            value={emailPasswordInput}
                                            onChange={(e) => setEmailPasswordInput(e.target.value)}
                                            style={{...inputStyle, paddingRight: '2rem'}}
                                            className="font-crimson"
                                            placeholder="Current Passphrase (Required)"
                                        />
                                        <button type="button" onClick={() => setShowEmailPassword(!showEmailPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#7a5a22] hover:text-[#502d0a] transition-colors">
                                            {showEmailPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                                        </button>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={handleInitiateEmail} disabled={isEmailInitiating || !emailInput || !emailPasswordInput} style={{...buttonBase, opacity: (isEmailInitiating || !emailInput || !emailPasswordInput) ? 0.5 : 1}} className="font-special-elite hover:bg-[rgba(80,40,10,0.05)] transition-colors">
                                            {isEmailInitiating ? "Initiating..." : "Initiate Change"}
                                        </button>
                                        <button onClick={handleCancelEmail} style={buttonBase} className="font-special-elite hover:bg-[rgba(80,40,10,0.05)] transition-colors">Cancel</button>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* --- PASSWORD SECTION --- */}
                        <section>
                            <div className="flex justify-between items-end mb-2">
                                <label className="font-special-elite" style={labelStyle}>Secret Passphrase</label>
                                {!isEditingPassword && (
                                    <button onClick={() => setIsEditingPassword(true)} className="text-[#7a5a22] hover:text-[#502d0a] transition-colors p-1">
                                        <Edit2 size={16} />
                                    </button>
                                )}
                            </div>
                            
                            {!isEditingPassword ? (
                                <p className="font-crimson text-xl text-[#1c0f02] border-b-[1.5px] border-transparent px-1 pb-1 animate-fade-in">••••••••••••</p>
                            ) : (
                                <div className="space-y-5 p-4 border border-[rgba(80,45,10,0.2)] rounded bg-[rgba(255,255,255,0.3)] shadow-inner animate-fade-in">
                                    <div className="relative">
                                        <input type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{...inputStyle, paddingRight: '2rem'}} className="font-crimson" placeholder="Current Passphrase" />
                                        <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#7a5a22] hover:text-[#502d0a] transition-colors"><Eye size={16} strokeWidth={1.5} /></button>
                                    </div>
                                    <div className="relative">
                                        <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{...inputStyle, paddingRight: '2rem'}} className="font-crimson" placeholder="New Passphrase" />
                                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#7a5a22] hover:text-[#502d0a] transition-colors"><Eye size={16} strokeWidth={1.5} /></button>
                                    </div>
                                    <div className="relative">
                                        <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{...inputStyle, paddingRight: '2rem'}} className="font-crimson" placeholder="Confirm New Passphrase" />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#7a5a22] hover:text-[#502d0a] transition-colors"><Eye size={16} strokeWidth={1.5} /></button>
                                    </div>

                                    {currentPassword && newPassword && currentPassword === newPassword && (
                                        <p className="font-crimson text-red-600 text-sm italic">New passphrase must be different from current.</p>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            onClick={handleSavePassword} 
                                            disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || currentPassword === newPassword} 
                                            style={{...buttonBase, opacity: (loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || currentPassword === newPassword) ? 0.5 : 1}} 
                                            className="font-special-elite hover:bg-[rgba(80,40,10,0.05)] transition-colors"
                                        >
                                            {loading ? "Saving..." : "Update Passphrase"}
                                        </button>
                                        <button onClick={handleCancelPassword} style={buttonBase} className="font-special-elite hover:bg-[rgba(80,40,10,0.05)] transition-colors">Cancel</button>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* --- DANGER ZONE --- */}
                    <section>
                        <div className="mb-4">
                            <p className="font-special-elite" style={{ fontSize: 11, color: "#8a2510", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                                Danger Zone
                            </p>
                        </div>
                        <div
                            className="rounded p-4"
                            style={{ border: "1.5px solid rgba(160,40,20,0.28)", background: "rgba(160,40,20,0.04)" }}
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="font-im-fell text-lg italic" style={{ color: "#4c1a0a" }}>Delete Account</p>
                                    <p className="font-crimson mt-0.5 text-sm italic" style={{ color: "#7a3a18" }}>
                                        Permanently erase your account and all associated records.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteAccountModalOpen(true)}
                                    className="font-special-elite flex-shrink-0 rounded-sm px-4 py-2.5 text-[10px] uppercase tracking-[0.22em] transition-colors hover:bg-[rgba(160,40,20,0.1)]"
                                    style={{
                                        border: "1.5px solid rgba(160,40,20,0.4)",
                                        color: "#8a2510",
                                        cursor: "pointer",
                                    }}
                                >
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* OTP Modal Overlay */}
            {showOtpModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[#f5e9c8] p-8 rounded shadow-2xl max-w-md w-full border-2 border-[#502d0a] relative">
                        <button onClick={() => setShowOtpModal(false)} className="absolute top-4 right-4 text-[#7a5a22] hover:text-[#502d0a]">
                            <X size={20} />
                        </button>
                        <h2 className="font-im-fell text-2xl text-[#2c1a06] italic mb-2">Verify New Address</h2>
                        <p className="font-crimson text-[#7a5928] mb-6">Enter the verification seal sent to <strong className="text-[#3a1f05]">{pendingEmail}</strong></p>
                        
                        <div className="mb-6">
                            <OTPInput value={otpDigits} onChange={setOtpDigits} disabled={loading} />
                        </div>
                        
                        <button onClick={handleVerifyEmail} disabled={loading} style={{...buttonBase, width: '100%', justifyContent: 'center', marginTop: '1rem'}} className="font-special-elite hover:bg-[rgba(80,40,10,0.05)] transition-colors">
                            {loading ? "Verifying..." : "Confirm Address Change"}
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Account Modal */}
            <DeleteAccountModal
                isOpen={isDeleteAccountModalOpen}
                onClose={() => setIsDeleteAccountModalOpen(false)}
                onDeleted={handleAccountDeleted}
            />
        </div>
    );
}
