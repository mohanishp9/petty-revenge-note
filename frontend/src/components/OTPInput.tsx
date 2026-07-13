"use client";

import { useRef, KeyboardEvent, ClipboardEvent, ChangeEvent, useId } from "react";

interface OTPInputProps {
    value: string[];          // Array of 6 single characters
    onChange: (value: string[]) => void;
    disabled?: boolean;
}

const OTPInput = ({ value, onChange, disabled = false }: OTPInputProps) => {
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const baseId = useId();

    const focusInput = (index: number) => {
        if (index >= 0 && index < 6) {
            inputRefs.current[index]?.focus();
            inputRefs.current[index]?.select();
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
        const raw = e.target.value;
        // Accept only the last typed digit (handles cases where input already has a value)
        const digit = raw.replace(/\D/g, "").slice(-1);

        const next = [...value];
        next[index] = digit;
        onChange(next);

        // Auto-advance focus if digit was entered
        if (digit) {
            focusInput(index + 1);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace") {
            e.preventDefault();
            const next = [...value];

            if (next[index]) {
                // Clear current cell first
                next[index] = "";
                onChange(next);
            } else {
                // If current cell already empty, clear previous and focus it
                if (index > 0) {
                    next[index - 1] = "";
                    onChange(next);
                    focusInput(index - 1);
                }
            }
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            focusInput(index - 1);
        } else if (e.key === "ArrowRight") {
            e.preventDefault();
            focusInput(index + 1);
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!pasted) return;

        const next = [...value];
        for (let i = 0; i < 6; i++) {
            next[i] = pasted[i] ?? "";
        }
        onChange(next);

        // Focus the last filled box or the 6th one
        const lastFilledIndex = Math.min(pasted.length, 5);
        focusInput(lastFilledIndex);
    };

    return (
        <div
            role="group"
            aria-label="One-time password input"
            style={{ display: "flex", gap: "0.5rem", justifyContent: "center", position: "relative" }}
        >
            <input type="text" autoComplete="one-time-code" style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }} tabIndex={-1} onChange={(e) => {
                const pasted = e.target.value.replace(/\D/g, "").slice(0, 6);
                if (pasted.length === 6) {
                    const next = pasted.split("");
                    onChange(next);
                }
            }} />
            {Array.from({ length: 6 }).map((_, i) => (
                <input
                    key={i}
                    id={`${baseId}-otp-${i}`}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={2}
                    value={value[i] ?? ""}
                    disabled={disabled}
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    aria-label={`OTP digit ${i + 1}`}
                    onChange={(e) => handleChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    onPaste={handlePaste}
                    onFocus={(e) => e.target.select()}
                    className="ledger-otp-cell"
                    style={{
                        width: 42,
                        height: 52,
                        textAlign: "center",
                        fontSize: 22,
                        fontWeight: 700,
                        color: "#1c0f02",
                        background: "rgba(255,255,255,0.25)",
                        border: "none",
                        borderBottom: `2px solid ${value[i] ? "rgba(80,40,10,0.7)" : "rgba(80,45,10,0.35)"}`,
                        borderRadius: 0,
                        outline: "none",
                        cursor: disabled ? "not-allowed" : "text",
                        opacity: disabled ? 0.5 : 1,
                        transition: "all 0.12s var(--ease-quill)",
                        caretColor: "#1e0f02",
                        letterSpacing: "0.05em",
                        fontFamily: "var(--font-special-elite), monospace",
                    }}
                />
            ))}
        </div>
    );
};

export default OTPInput;
