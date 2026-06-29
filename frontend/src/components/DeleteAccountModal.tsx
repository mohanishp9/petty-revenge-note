"use client";

import { useState } from "react";
import { Eye, EyeOff, X, Loader2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import OTPInput from "@/components/OTPInput";
import { deleteAccountInitiateAPI, deleteAccountConfirmAPI } from "@/features/auth/authApi";

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called when deletion is confirmed and succeeds — parent should handle logout + redirect */
    onDeleted: () => void;
}

type Step = "password" | "otp";

const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: "1.5px solid rgba(160,40,20,0.4)",
    borderRadius: 0,
    padding: "0.3rem 2rem 0.4rem 0.1rem",
    fontSize: 17,
    color: "#1c0f02",
    outline: "none",
};

export default function DeleteAccountModal({ isOpen, onClose, onDeleted }: DeleteAccountModalProps) {
    const [step, setStep] = useState<Step>("password");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
    const [isLoading, setIsLoading] = useState(false);

    const otpValue = otpDigits.join("");
    const isOtpComplete = otpValue.length === 6;

    const resetState = () => {
        setStep("password");
        setPassword("");
        setShowPassword(false);
        setOtpDigits(Array(6).fill(""));
        setIsLoading(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleInitiate = async () => {
        if (!password) {
            toast.error("Please enter your current passphrase.");
            return;
        }
        setIsLoading(true);
        try {
            await deleteAccountInitiateAPI({ password });
            toast.success("Deletion OTP sent to your email.");
            setStep("otp");
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
            const status = axiosErr.response?.status;
            const message = axiosErr.response?.data?.message;

            if (status === 401) {
                toast.error("Incorrect passphrase. Please try again.");
            } else if (status === 429) {
                toast.error("Too many requests. Please wait before trying again.");
            } else {
                toast.error(message || "Something went wrong. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!isOtpComplete) {
            toast.error("Please enter the complete 6-digit OTP.");
            return;
        }
        setIsLoading(true);
        try {
            await deleteAccountConfirmAPI({ otp: otpValue });
            // Success — parent handles logout + redirect
            onDeleted();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
            const status = axiosErr.response?.status;
            const message = axiosErr.response?.data?.message;

            if (status === 409) {
                // WATCH/EXEC conflict — concurrent request
                toast.error("Concurrent request detected. Please try again.");
            } else if (status === 400 && message?.includes("attempts remaining")) {
                // Wrong OTP with remaining tries — show exact backend message
                toast.error(message);
            } else if (status === 400 && message?.includes("expired")) {
                // OTP expired — reset to step 1 so user re-initiates
                toast.error("OTP has expired. Please enter your passphrase again to send a new one.");
                resetState();
            } else if (status === 400 && message?.includes("exceeded")) {
                // Max attempts hit — reset to step 1
                toast.error("Maximum attempts exceeded. Please start the deletion process again.");
                resetState();
            } else if (status === 429) {
                toast.error("Too many requests. Please wait before trying again.");
            } else {
                toast.error(message || "Something went wrong. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!password) {
            // Password was cleared after going to step 2 — reset to step 1
            toast.error("Please go back and re-enter your passphrase to resend OTP.");
            resetState();
            return;
        }
        setIsLoading(true);
        try {
            await deleteAccountInitiateAPI({ password });
            setOtpDigits(Array(6).fill(""));
            toast.success("A new OTP has been sent to your email.");
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
            const status = axiosErr.response?.status;
            if (status === 429) {
                toast.error("Too many OTP requests. Please wait 1 hour before trying again.");
            } else {
                toast.error(axiosErr.response?.data?.message || "Failed to resend OTP.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(20,10,0,0.55)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div
                className="relative w-full max-w-md rounded-sm border"
                style={{
                    background: "repeating-linear-gradient(180deg, rgba(124,83,20,0.02), rgba(124,83,20,0.02) 33px, rgba(124,83,20,0.14) 33px, rgba(124,83,20,0.14) 34px),linear-gradient(180deg, #f6ebc7 0%, #f2e4ba 48%, #eeddb0 100%)",
                    borderColor: "rgba(160,40,20,0.35)",
                    boxShadow: "0 30px 70px rgba(40,20,0,0.4), 0 0 0 1px rgba(160,40,20,0.15)",
                }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-modal-title"
            >
                {/* Red danger accent bar at the top */}
                <div className="h-1 w-full rounded-t-sm" style={{ background: "linear-gradient(90deg, #8a2510, #c0391a, #8a2510)" }} />

                <div className="p-6">
                    {/* Header */}
                    <div className="mb-5 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm"
                                style={{ background: "rgba(160,40,20,0.1)", border: "1px solid rgba(160,40,20,0.3)" }}
                            >
                                <AlertTriangle className="h-5 w-5" style={{ color: "#8a2510" }} />
                            </div>
                            <div>
                                <p className="font-special-elite text-[10px] uppercase tracking-[0.22em]" style={{ color: "#8a2510" }}>
                                    Danger Zone
                                </p>
                                <h2
                                    id="delete-modal-title"
                                    className="font-im-fell mt-0.5 text-2xl italic"
                                    style={{ color: "#4c1a0a" }}
                                >
                                    {step === "password" ? "Delete Account" : "Confirm Deletion"}
                                </h2>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-sm border transition-colors"
                            style={{ borderColor: "rgba(120,80,20,0.2)", color: "#6a4515" }}
                            aria-label="Close modal"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Step indicator */}
                    <div className="mb-5 flex items-center gap-2">
                        <div
                            className="h-1.5 flex-1 rounded-full"
                            style={{ background: step === "password" ? "rgba(160,40,20,0.8)" : "rgba(160,40,20,0.25)" }}
                        />
                        <div
                            className="h-1.5 flex-1 rounded-full transition-all duration-300"
                            style={{ background: step === "otp" ? "rgba(160,40,20,0.8)" : "rgba(160,40,20,0.15)" }}
                        />
                    </div>

                    {/* ── Step 1: Password ── */}
                    {step === "password" && (
                        <div className="space-y-5">
                            <div
                                className="rounded-sm p-4"
                                style={{ background: "rgba(160,40,20,0.06)", border: "1px solid rgba(160,40,20,0.18)" }}
                            >
                                <p className="font-crimson text-[15px] leading-7" style={{ color: "#3a1208" }}>
                                    This will <strong>permanently erase</strong> your account — including all notes, comments, likes, and reactions. This action <strong>cannot be undone</strong>.
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="delete-password"
                                    className="font-special-elite mb-2 block text-[10px] uppercase tracking-[0.22em]"
                                    style={{ color: "#7a3a18" }}
                                >
                                    Current Passphrase
                                </label>
                                <div className="relative">
                                    <input
                                        id="delete-password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter" && password && !isLoading) handleInitiate(); }}
                                        style={inputStyle}
                                        className="font-crimson"
                                        placeholder="Enter your current passphrase"
                                        autoComplete="current-password"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 transition-colors"
                                        style={{ color: "#7a5a22" }}
                                        tabIndex={-1}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={isLoading}
                                    className="font-special-elite rounded-sm px-4 py-3 text-[10px] uppercase tracking-[0.22em] transition-colors"
                                    style={{ border: "1px solid rgba(120,80,20,0.22)", color: "#6a4515" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleInitiate}
                                    disabled={!password || isLoading}
                                    className="font-special-elite flex items-center justify-center gap-2 rounded-sm px-4 py-3 text-[10px] uppercase tracking-[0.22em] transition-all"
                                    style={{
                                        background: password && !isLoading ? "rgba(160,40,20,0.1)" : "transparent",
                                        border: "1px solid rgba(160,40,20,0.35)",
                                        color: "#8a2510",
                                        opacity: !password || isLoading ? 0.55 : 1,
                                        cursor: !password || isLoading ? "not-allowed" : "pointer",
                                    }}
                                >
                                    {isLoading ? (
                                        <><Loader2 className="h-3 w-3 animate-spin" /> Sending OTP...</>
                                    ) : (
                                        "Send Deletion OTP"
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: OTP ── */}
                    {step === "otp" && (
                        <div className="space-y-5">
                            <p className="font-crimson text-[15px] leading-7" style={{ color: "#3a1208" }}>
                                A 6-digit OTP has been sent to your registered email address. It expires in <strong>10 minutes</strong>. Enter it below to permanently delete your account.
                            </p>

                            <div>
                                <p
                                    className="font-special-elite mb-4 text-[10px] uppercase tracking-[0.22em]"
                                    style={{ color: "#7a3a18" }}
                                >
                                    One-Time Passphrase
                                </p>
                                <OTPInput
                                    value={otpDigits}
                                    onChange={setOtpDigits}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-between sm:items-center">
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={isLoading}
                                    className="font-special-elite text-[10px] uppercase tracking-[0.18em] transition-colors"
                                    style={{ color: "#7a5a22", opacity: isLoading ? 0.5 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}
                                >
                                    Resend OTP
                                </button>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() => { setStep("password"); setOtpDigits(Array(6).fill("")); }}
                                        disabled={isLoading}
                                        className="font-special-elite rounded-sm px-4 py-3 text-[10px] uppercase tracking-[0.22em] transition-colors"
                                        style={{ border: "1px solid rgba(120,80,20,0.22)", color: "#6a4515" }}
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirm}
                                        disabled={!isOtpComplete || isLoading}
                                        className="font-special-elite flex items-center justify-center gap-2 rounded-sm px-4 py-3 text-[10px] uppercase tracking-[0.22em] transition-all"
                                        style={{
                                            background: isOtpComplete && !isLoading ? "rgba(160,40,20,0.15)" : "transparent",
                                            border: "1px solid rgba(160,40,20,0.45)",
                                            color: "#8a2510",
                                            opacity: !isOtpComplete || isLoading ? 0.55 : 1,
                                            cursor: !isOtpComplete || isLoading ? "not-allowed" : "pointer",
                                        }}
                                    >
                                        {isLoading ? (
                                            <><Loader2 className="h-3 w-3 animate-spin" /> Deleting...</>
                                        ) : (
                                            "Permanently Delete Account"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
