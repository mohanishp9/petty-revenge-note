"use client";

import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    initiateRegistration,
    verifyRegistrationOtp,
    resendOtp,
    clearError,
} from "@/features/auth/authSlice";
import { AppDispatch, RootState } from "@/store/store";
import { OtpError } from "@/features/auth/types";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import OTPInput from "@/components/OTPInput";
import ResendTimer from "@/components/ResendTimer";

//localStorage key
const LS_KEY = "registration_pending_email";

const clearPendingRegistration = () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem(LS_KEY);
    }
};

// Shared styles matching notebook aesthetic
const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    color: "#7a5a22",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: "0.3rem",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: "1.5px solid rgba(80,45,10,0.45)",
    borderRadius: 0,
    padding: "0.3rem 0.1rem 0.4rem",
    fontSize: 17,
    color: "#1c0f02",
    outline: "none",
};

const submitButtonStyle = (loading: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "0.75rem 1rem",
    background: "transparent",
    border: "2px solid rgba(80,40,10,0.5)",
    borderRadius: 2,
    fontSize: 13,
    opacity: loading ? 0.6 : 1,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "#3a1f05",
    cursor: loading ? "not-allowed" : "pointer",
});

// Component
const Register = () => {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();

    // Redux state
    const { loading, error, user } = useSelector((state: RootState) => state.auth);

    // Local UI state
    const [step, setStep] = useState<1 | 2>(1);

    // Step 1 form
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Step 2 OTP
    const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
    const [pendingEmail, setPendingEmail] = useState("");
    const [isRateLimited, setIsRateLimited] = useState(false);
    // Separate loading tracker for resend (doesn't block verify button)
    const [resendLoading, setResendLoading] = useState(false);

    // Crash-proof hydration on mount
    // If user refreshed on step 2, localStorage still has the email → restore step 2
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(LS_KEY);
            if (saved) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setPendingEmail(saved);
                setStep(2);
            }
        }
    }, []);

    // Redirect after successful verify
    useEffect(() => {
        if (user) {
            toast.success("Welcome to Petty Revenge Notes!");
            router.push("/home");
        }
    }, [user, router]);

    // Error handling
    // OTP-specific errors carry { message, status }. Login/logout errors are plain strings.
    useEffect(() => {
        if (!error) return;

        const isOtpError = typeof error === "object" && "status" in error;

        if (isOtpError) {
            const { message, status } = error as OtpError;

            if (step === 1) {
                // Initiate errors
                if (status === 409) {
                    toast.error("Email or username is already taken.");
                } else if (status === 429) {
                    toast.error("Too many requests. Please wait 1 hour.");
                } else {
                    toast.error(message || "Something went wrong. Please try again.");
                }
            } else if (step === 2) {
                // Verify errors
                if (status === 400) {
                    if (message?.toLowerCase().includes("expired")) {
                        // OTP TTL hit in Redis
                        toast.error("OTP expired. Please start registration again.");
                        clearPendingRegistration();
                        // eslint-disable-next-line react-hooks/set-state-in-effect
                        setStep(1);
                        setOtpDigits(Array(6).fill(""));
                    } else {
                        // Wrong OTP — backend message includes "X attempts remaining"
                        toast.error(message || "Invalid OTP. Please try again.");
                        setOtpDigits(Array(6).fill("")); // clear boxes for re-entry
                    }
                } else if (status === 429) {
                    // Max verify attempts exceeded
                    toast.error("Maximum attempts exceeded. Please start over.");
                    clearPendingRegistration();
                    setStep(1);
                    setOtpDigits(Array(6).fill(""));
                } else {
                    toast.error(message || "Something went wrong.");
                }
            }
        } else if (typeof error === "string") {
            // Plain string errors from login/logout/etc — shouldn't appear here but guard anyway
            toast.error(error);
        }

        dispatch(clearError());
    }, [error, step, dispatch]);

    // Step 1 submit
    const handleStep1Submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!username.trim() || !email.trim() || !password.trim()) {
            toast.error("Please fill all fields.");
            return;
        }

        const result = await dispatch(initiateRegistration({ username, email, password }));

        if (initiateRegistration.fulfilled.match(result)) {
            setPendingEmail(email);
            setStep(2);
            toast.success("OTP sent to your email! Expires in 10 minutes.");
        }
        // Errors handled by the useEffect above
    };

    // Step 2 verify submit
    const handleVerifySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const otp = otpDigits.join("");
        if (otp.length < 6) {
            toast.error("Please enter the complete 6-digit code.");
            return;
        }

        await dispatch(verifyRegistrationOtp({ email: pendingEmail, otp }));
        // Success → user effect redirects. Error → error effect handles toast + step reset.
    };

    // Resend handler
    const handleResend = useCallback(async () => {
        setResendLoading(true);

        const result = await dispatch(resendOtp({ email: pendingEmail }));

        setResendLoading(false);

        if (resendOtp.fulfilled.match(result)) {
            toast.success("New OTP sent to your email.");
            // ResendTimer restarts its own countdown via onResend callback
        } else {
            // Error handled in useEffect — but also check for rate limit specifically
            const payload = result.payload as OtpError | undefined;
            if (payload?.status === 429) {
                setIsRateLimited(true);
                toast.error("Rate limit reached. Please wait 1 hour before requesting another OTP.");
            } else if (payload?.status === 400) {
                // Session expired in Redis
                toast.error("Session expired. Please start registration again.");
                clearPendingRegistration();
                setStep(1);
                setOtpDigits(Array(6).fill(""));
            }
        }
    }, [dispatch, pendingEmail]);

    // Notebook shell (shared between steps)
    return (
        <div
            className="relative min-h-screen flex items-center justify-center p-8 overflow-hidden font-crimson"
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
                        transform:
                            pos === "tr"
                                ? "scaleX(-1)"
                                : pos === "bl"
                                ? "scaleY(-1)"
                                : pos === "br"
                                ? "scale(-1)"
                                : "none",
                    }}
                >
                    ❧
                </span>
            ))}

            {/* Notebook card */}
            <div className="relative w-full max-w-md">
                {/* Spiral binding */}
                <div
                    className="absolute left-11 top-0 bottom-0 w-6 z-10 flex flex-col justify-around items-center"
                    style={{
                        background: "#2a1800",
                        borderLeft: "2px solid #3d2200",
                        borderRight: "2px solid #1a0d00",
                    }}
                >
                    {Array.from({ length: 16 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-full"
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
                    className="relative ml-11 rounded-r"
                    style={{
                        background:
                            "linear-gradient(180deg, #f2e4b5 0%, #f5e9c8 30%, #f0e2b8 60%, #ede0b4 100%)",
                        padding: "3rem 2.5rem 2.5rem 3rem",
                        boxShadow: "-4px 0 12px rgba(0,0,0,0.4), 4px 4px 20px rgba(0,0,0,0.5)",
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
                        className="absolute top-0 bottom-0"
                        style={{ left: 52, width: 1.5, background: "rgba(180,40,30,0.35)" }}
                    />

                    {/* Header — always visible */}
                    <p
                        className="font-special-elite"
                        style={{
                            fontSize: 11,
                            color: "#6b4c1e",
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            opacity: 0.7,
                            marginBottom: "0.4rem",
                        }}
                    >
                        Volume I — The Ledger of Wrongs
                    </p>

                    <h1
                        className="font-im-fell"
                        style={{ fontSize: 26, color: "#2c1a06", fontStyle: "italic", lineHeight: 1.2, marginBottom: "0.2rem" }}
                    >
                        Petty Revenge
                        <br />
                        Notes
                    </h1>

                    <p
                        className="font-crimson"
                        style={{ fontSize: 13, color: "#7a5928", fontStyle: "italic", marginBottom: "1.6rem", opacity: 0.8 }}
                    >
                        — wherein justice is recorded, one slight at a time
                    </p>

                    <hr style={{ border: "none", borderTop: "1px solid rgba(100,65,15,0.3)", marginBottom: "1.6rem" }} />

                    {/* STEP 1: Registration Details */}
                    {step === 1 && (
                        <form onSubmit={handleStep1Submit} className="space-y-5">
                            <div>
                                <label className="font-special-elite" htmlFor="username" style={labelStyle}>
                                    Identity Code
                                </label>
                                <input
                                    className="font-crimson"
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter Your Identity Code"
                                    disabled={loading}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label className="font-special-elite" htmlFor="email" style={labelStyle}>
                                    {"Correspondent's Address"}
                                </label>
                                <input
                                    className="font-crimson"
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your.grievance@mail.com"
                                    disabled={loading}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label className="font-special-elite" htmlFor="password" style={labelStyle}>
                                    Secret Passphrase
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="known only to you..."
                                        disabled={loading}
                                        className="font-crimson"
                                        style={inputStyle}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#7a5a22] hover:text-[#502d0a] transition-colors flex items-center justify-center"
                                        tabIndex={-1}
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="font-special-elite"
                                style={submitButtonStyle(loading)}
                            >
                                {loading ? "Dispatching..." : "⟶  Enter the Archive"}
                            </button>

                            <p
                                className="font-crimson"
                                style={{ textAlign: "center", marginTop: "1.2rem", fontSize: 14, color: "#7a5928", fontStyle: "italic" }}
                            >
                                Already inscribed?{" "}
                                <span
                                    onClick={() => router.push("/login")}
                                    style={{ color: "#5a2a08", cursor: "pointer", borderBottom: "1px dotted rgba(90,42,8,0.4)", fontStyle: "normal", fontWeight: 600 }}
                                >
                                    Begin your chronicle
                                </span>
                            </p>
                        </form>
                    )}

                    {/* STEP 2: OTP Verification */}
                    {step === 2 && (
                        <form onSubmit={handleVerifySubmit} className="space-y-5">
                            <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
                                <p
                                    className="font-special-elite"
                                    style={{ fontSize: 11, color: "#7a5a22", letterSpacing: "0.12em", textTransform: "uppercase" }}
                                >
                                    Verification Seal
                                </p>
                                <p
                                    className="font-crimson"
                                    style={{ fontSize: 13, color: "#7a5928", fontStyle: "italic", marginTop: "0.3rem" }}
                                >
                                    A 6-digit code was dispatched to{" "}
                                    <strong style={{ color: "#3a1f05", fontStyle: "normal" }}>{pendingEmail}</strong>
                                </p>
                            </div>

                            <OTPInput
                                value={otpDigits}
                                onChange={setOtpDigits}
                                disabled={loading}
                            />

                            <button
                                type="submit"
                                disabled={loading}
                                className="font-special-elite"
                                style={submitButtonStyle(loading)}
                            >
                                {loading ? "Verifying seal..." : "⟶  Verify & Enter"}
                            </button>

                            {/* Resend timer */}
                            <ResendTimer
                                onResend={handleResend}
                                isResendLoading={resendLoading}
                                isRateLimited={isRateLimited}
                            />

                            {/* Back to step 1 escape hatch */}
                            <p
                                className="font-crimson"
                                style={{ textAlign: "center", fontSize: 12, color: "#9a7a48", fontStyle: "italic", marginTop: "0.5rem" }}
                            >
                                Wrong email?{" "}
                                <span
                                    onClick={() => {
                                        clearPendingRegistration();
                                        setStep(1);
                                        setOtpDigits(Array(6).fill(""));
                                        setIsRateLimited(false);
                                    }}
                                    style={{ color: "#5a2a08", cursor: "pointer", borderBottom: "1px dotted rgba(90,42,8,0.4)", fontStyle: "normal" }}
                                >
                                    Start over
                                </span>
                            </p>
                        </form>
                    )}

                    {/* Page number */}
                    <p
                        className="font-im-fell"
                        style={{ position: "absolute", bottom: 10, right: 16, fontSize: 11, color: "rgba(100,70,20,0.4)", fontStyle: "italic" }}
                    >
                        pg. {step}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;