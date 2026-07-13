"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ResendTimerProps {
    onResend: () => void;        // Called when user clicks Resend
    isResendLoading: boolean;    // True while the resend API is in flight
    isRateLimited: boolean;      // True when backend returned 429 — lock button entirely
}

const COOLDOWN_SECONDS = 60;

const ResendTimer = ({ onResend, isResendLoading, isRateLimited }: ResendTimerProps) => {
    const [secondsLeft, setSecondsLeft] = useState(COOLDOWN_SECONDS);
    const [canResend, setCanResend] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startTimer = useCallback(() => {
        setCanResend(false);
        setSecondsLeft(COOLDOWN_SECONDS);

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    // Start timer on mount
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        startTimer();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [startTimer]);

    const handleClick = () => {
        if (!canResend || isResendLoading || isRateLimited) return;
        onResend();
        // Restart timer after resend (backend will handle if rate-limited)
        startTimer();
    };

    // Rate limited state — button fully locked, no countdown needed
    if (isRateLimited) {
        return (
            <p
                className="font-crimson"
                style={{
                    textAlign: "center",
                    fontSize: 13,
                    color: "#8a2510",
                    fontStyle: "italic",
                    marginTop: "0.5rem",
                }}
            >
                Rate limit reached. Please wait 1 hour before requesting a new code.
            </p>
        );
    }

    // Active state
    const isDisabled = !canResend || isResendLoading;

    return (
        <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
            {!canResend ? (
                // Countdown display
                <p className="font-crimson" style={{ fontSize: 13, color: "#7a5928", fontStyle: "italic" }}>
                    Resend code in{" "}
                    <span
                        className="font-special-elite"
                        style={{ color: "#3a1f05", fontStyle: "normal", fontWeight: 600 }}
                    >
                        {secondsLeft}s
                    </span>
                </p>
            ) : (
                // Resend button
                <button
                    type="button"
                    onClick={handleClick}
                    disabled={isDisabled}
                    className="font-special-elite"
                    style={{
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        fontSize: 12,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: isDisabled ? "#b09070" : "#5a2a08",
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        borderBottom: isDisabled
                            ? "1px dotted rgba(90,42,8,0.2)"
                            : "1px dotted rgba(90,42,8,0.5)",
                        opacity: isDisabled ? 0.6 : 1,
                        transition: "opacity 0.2s ease, color 0.2s ease",
                    }}
                >
                    {isResendLoading ? "Dispatching..." : "⟲  Resend Code"}
                </button>
            )}
        </div>
    );
};

export default ResendTimer;
