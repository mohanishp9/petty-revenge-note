"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import OTPInput from "@/components/OTPInput";
import { forgotPasswordAPI, resetPasswordAPI } from "@/features/auth/authApi";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Step 1
    const [email, setEmail] = useState("");
    
    // Step 2
    const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleInitiate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error("Please provide an email.");
            return;
        }

        setLoading(true);
        try {
            await forgotPasswordAPI({ email: email.trim() });
            toast.success("OTP sent to your email.");
            setStep(2);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.message || "Failed to send OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        const otp = otpDigits.join("");
        if (otp.length !== 6) {
            toast.error("Please enter all 6 digits of the OTP.");
            return;
        }
        if (newPassword.length < 8) {
            toast.error("Password must have at least 8 characters");
            return;
        }
        if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            toast.error("Passphrase must contain at least one Capital letter and one number.");
            return;
        }

        setLoading(true);
        try {
            await resetPasswordAPI({ email: email.trim(), otp, newPassword });
            toast.success("Password reset successfully.");
            router.push("/login");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.message || "Failed to reset password.");
            if (err.response?.status === 400 && !err.response?.data?.message?.includes("must be different")) {
                 setOtpDigits(Array(6).fill(""));
            }
        } finally {
            setLoading(false);
        }
    };

    const submitButtonStyle = (isLoading: boolean) => ({
        width: "100%", padding: "0.75rem 1rem", background: "transparent",
        border: "2px solid rgba(80,40,10,0.5)", borderRadius: 2,
        fontSize: 13,
        letterSpacing: "0.22em", textTransform: "uppercase" as const,
        color: "#3a1f05", cursor: isLoading ? "not-allowed" : "pointer",
        opacity: isLoading ? 0.6 : 1, transition: "all 0.2s"
    });

    return (
        <div className="relative min-h-screen flex items-center justify-center p-3 sm:p-8 overflow-x-hidden overflow-y-auto font-crimson animate-fade-in" style={{ backgroundColor: "#1a0f00" }}>
            {/* Horizontal ruled lines overlay */}
            <div className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: "repeating-linear-gradient(180deg, transparent, transparent 31px, rgba(80,50,10,0.08) 31px, rgba(80,50,10,0.08) 32px)"
                }} />

            {/* Flourishes */}
            {["tl", "tr", "bl", "br"].map((pos) => (
                <span key={pos} className="absolute text-7xl select-none pointer-events-none font-im-fell"
                    style={{
                        color: "#c8a96e", opacity: 0.18,
                        top: pos.startsWith("t") ? "1.5rem" : "auto",
                        bottom: pos.startsWith("b") ? "1.5rem" : "auto",
                        left: pos.endsWith("l") ? "1.5rem" : "auto",
                        right: pos.endsWith("r") ? "1.5rem" : "auto",
                        transform: pos === "tr" ? "scaleX(-1)" : pos === "bl" ? "scaleY(-1)" : pos === "br" ? "scale(-1)" : "none"
                    }}>❧</span>
            ))}

            <div className="relative w-full max-w-md my-8">
                {/* Spiral binding */}
                <div
                    className="absolute left-2 sm:left-11 top-0 bottom-0 w-6 z-10 flex flex-col justify-around items-center"
                    style={{ background: "#2a1800", borderLeft: "2px solid #3d2200", borderRight: "2px solid #1a0d00" }}
                >
                    {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className="rounded-full" style={{ width: 14, height: 14, background: "#110900", border: "1.5px solid #4a2e00", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.8)" }} />
                    ))}
                </div>

                {/* Paper */}
                <div
                    className="relative ml-2 sm:ml-11 rounded-r py-8 pr-5 pl-12 sm:py-12 sm:pr-10 sm:pl-16"
                    style={{
                        background: "linear-gradient(180deg, #f2e4b5 0%, #f5e9c8 30%, #f0e2b8 60%, #ede0b4 100%)",
                        boxShadow: "-4px 0 12px rgba(0,0,0,0.4), 4px 4px 20px rgba(0,0,0,0.5)",
                    }}
                >
                    {/* Ruled lines */}
                    <div className="absolute inset-0 pointer-events-none rounded-r" style={{ backgroundImage: "repeating-linear-gradient(180deg, transparent, transparent 31px, rgba(100,60,10,0.12) 31px, rgba(100,60,10,0.12) 32px)" }} />
                    {/* Red margin line */}
                    <div className="absolute top-0 bottom-0 left-8 sm:left-[52px]" style={{ width: 1.5, background: "rgba(180,40,30,0.35)" }} />

                    <p className="font-special-elite" style={{ fontSize: 11, color: "#6b4c1e", letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.7, marginBottom: "0.4rem" }}>
                        Volume I — The Ledger of Wrongs
                    </p>

                    {step === 1 ? (
                        <>
                            <div className="text-center mb-6">
                                <h1 className="font-im-fell" style={{ fontSize: 32, color: "#2c1a06", letterSpacing: "0.02em", fontStyle: "italic" }}>
                                    Lost Key
                                </h1>
                                <p className="font-crimson" style={{ fontSize: 16, color: "#5c3a16", marginTop: "0.5rem" }}>
                                    — request a new seal for the archives
                                </p>
                            </div>
                            <form onSubmit={handleInitiate} className="space-y-6 relative z-20">
                                <div>
                                    <label className="font-special-elite" htmlFor="email" style={{ display: "block", fontSize: 11, color: "#7a5a22", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.3rem" }}>
                                        Correspondent&apos;s Address
                                    </label>
                                    <input
                                        className="font-crimson"
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your.grievance@mail.com"
                                        style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1.5px solid rgba(80,45,10,0.45)", borderRadius: 0, padding: "0.3rem 0.1rem 0.4rem", fontSize: 17, color: "#1c0f02", outline: "none" }}
                                    />
                                </div>
                                <button type="submit" disabled={loading} className="font-special-elite" style={submitButtonStyle(loading)}>
                                    {loading ? "Sending..." : "⟶  Request Reset"}
                                </button>
                                <div className="text-center mt-4">
                                    <Link href="/login" className="font-crimson text-sm italic hover:underline" style={{ color: "#7a5a22" }}>
                                        I remember my passphrase
                                    </Link>
                                </div>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="text-center mb-6">
                                <h1 className="font-im-fell" style={{ fontSize: 32, color: "#2c1a06", letterSpacing: "0.02em", fontStyle: "italic" }}>
                                    Forge New Key
                                </h1>
                                <p className="font-crimson" style={{ fontSize: 16, color: "#5c3a16", marginTop: "0.5rem" }}>
                                    — enter the seal sent to your address
                                </p>
                            </div>
                            <form onSubmit={handleReset} className="space-y-6 relative z-20">
                                <div>
                                    <label className="font-special-elite" style={{ display: "block", fontSize: 11, color: "#7a5a22", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.3rem" }}>
                                        Verification Seal
                                    </label>
                                    <OTPInput value={otpDigits} onChange={setOtpDigits} disabled={loading} />
                                </div>
                                <div>
                                    <label className="font-special-elite" htmlFor="newPassword" style={{ display: "block", fontSize: 11, color: "#7a5a22", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.3rem" }}>
                                        New Passphrase
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="newPassword"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="must be different..."
                                            className="font-crimson"
                                            style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1.5px solid rgba(80,45,10,0.45)", borderRadius: 0, padding: "0.3rem 0.1rem 0.4rem", paddingRight: "2rem", fontSize: 17, color: "#1c0f02", outline: "none" }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#7a5a22] hover:text-[#502d0a] transition-colors flex items-center justify-center"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="font-special-elite" style={submitButtonStyle(loading)}>
                                    {loading ? "Forging..." : "⟶  Reset Passphrase"}
                                </button>
                                <div className="text-center mt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep(1);
                                            setOtpDigits(Array(6).fill(""));
                                            setNewPassword("");
                                        }}
                                        className="font-crimson text-sm italic hover:underline" style={{ color: "#7a5a22" }}>
                                        Wrong address? Go back.
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
