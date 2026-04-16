"use client"

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, clearError } from "@/features/auth/authSlice";
import { AppDispatch, RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const Register = () => {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { loading, error, user } = useSelector(
        (state: RootState) => state.auth
    );

    useEffect(() => {
        if (user) {
            toast.success("Register successful");
            router.push("/home");
        }
    }, [user, router]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearError());
        }
    }, [error, dispatch]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!username || !email || !password) {
            toast.error("Please fill all fields");
            return;
        }

        dispatch(registerUser({ username, email, password }));
    }


    return (
        <div className="relative min-h-screen flex items-center justify-center p-8 overflow-hidden font-crimson"
            style={{ backgroundColor: "#1a0f00" }}>

            {/* Horizontal ruled lines overlay */}
            <div className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: "repeating-linear-gradient(180deg, transparent, transparent 31px, rgba(80,50,10,0.08) 31px, rgba(80,50,10,0.08) 32px)"
                }} />

            {/* Horizontal ruled lines overlay */}
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

            {/* Notebook */}
            <div className="relative w-full max-w-md">
                {/* Spiral binding */}
                <div className="absolute left-11 top-0 bottom-0 w-6 z-10 flex flex-col justify-around items-center"
                    style={{ background: "#2a1800", borderLeft: "2px solid #3d2200", borderRight: "2px solid #1a0d00" }}>
                    {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className="rounded-full"
                            style={{ width: 14, height: 14, background: "#110900", border: "1.5px solid #4a2e00", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.8)" }} />
                    ))}
                </div>
                <div className="relative ml-11 rounded-r"
                    style={{
                        background: "linear-gradient(180deg, #f2e4b5 0%, #f5e9c8 30%, #f0e2b8 60%, #ede0b4 100%)",
                        padding: "3rem 2.5rem 2.5rem 3rem",
                        boxShadow: "-4px 0 12px rgba(0,0,0,0.4), 4px 4px 20px rgba(0,0,0,0.5)",
                    }}>
                    <div className="absolute inset-0 pointer-events-none rounded-r"
                        style={{ backgroundImage: "repeating-linear-gradient(180deg, transparent, transparent 31px, rgba(100,60,10,0.12) 31px, rgba(100,60,10,0.12) 32px)" }} />

                    {/* Red margin line */}
                    <div className="absolute top-0 bottom-0" style={{ left: 52, width: 1.5, background: "rgba(180,40,30,0.35)" }} />

                    <p className="font-special-elite" style={{ fontSize: 11, color: "#6b4c1e", letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.7, marginBottom: "0.4rem" }}>
                        Volume I — The Ledger of Wrongs
                    </p>

                    <h1 className="font-im-fell" style={{ fontSize: 26, color: "#2c1a06", fontStyle: "italic", lineHeight: 1.2, marginBottom: "0.2rem" }}>
                        Petty Revenge<br />Notes
                    </h1>

                    <p className="font-crimson" style={{ fontSize: 13, color: "#7a5928", fontStyle: "italic", marginBottom: "1.6rem", opacity: 0.8 }}>
                        — wherein justice is recorded, one slight at a time
                    </p>

                    <hr style={{ border: "none", borderTop: "1px solid rgba(100,65,15,0.3)", marginBottom: "1.6rem" }} />

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            {/*Username*/}
                            <label className="font-special-elite" htmlFor="username" style={{ display: "block", fontSize: 11, color: "#7a5a22", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.3rem" }}>
                                Identity Code
                            </label>
                            <input
                                className="font-crimson"
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter Your Identity Code"
                                style={{
                                    width: "100%", background: "transparent", border: "none",
                                    borderBottom: "1.5px solid rgba(80,45,10,0.45)", borderRadius: 0,
                                    padding: "0.3rem 0.1rem 0.4rem",
                                    fontSize: 17, color: "#1c0f02", outline: "none"
                                }}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="font-special-elite" htmlFor="email" style={{ display: "block", fontSize: 11, color: "#7a5a22", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.3rem" }}>
                                {"Correspondent's Address"}
                            </label>
                            <input
                                className="font-crimson"
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your.grievance@mail.com"
                                style={{
                                    width: "100%", background: "transparent", border: "none",
                                    borderBottom: "1.5px solid rgba(80,45,10,0.45)", borderRadius: 0,
                                    padding: "0.3rem 0.1rem 0.4rem",
                                    fontSize: 17, color: "#1c0f02", outline: "none"
                                }}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="font-special-elite" htmlFor="password" style={{ display: "block", fontSize: 11, color: "#7a5a22", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.3rem" }}>
                                Secret Passphrase
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="known only to you..."
                                className="font-crimson"
                                style={{
                                    width: "100%", background: "transparent", border: "none",
                                    borderBottom: "1.5px solid rgba(80,45,10,0.45)", borderRadius: 0,
                                    padding: "0.3rem 0.1rem 0.4rem",
                                    fontSize: 17, color: "#1c0f02", outline: "none"
                                }}
                            />
                        </div>

                        {/*Submit*/}
                        <button
                            type="submit"
                            disabled={loading}
                            className="font-special-elite"
                            style={{
                                width: "100%", padding: "0.75rem 1rem", background: "transparent",
                                border: "2px solid rgba(80,40,10,0.5)", borderRadius: 2,
                                fontSize: 13,
                                opacity: loading ? 0.6 : 1,
                                letterSpacing: "0.22em", textTransform: "uppercase",
                                color: "#3a1f05", cursor: loading ? "not-allowed" : "pointer"
                            }}>
                            {loading ? "Inscribing..." : "⟶  Enter the Archive"}
                        </button>
                    </form>

                    <p className="font-crimson" style={{ textAlign: "center", marginTop: "1.2rem", fontSize: 14, color: "#7a5928", fontStyle: "italic" }}>
                        Not yet inscribed?{" "}
                        <span onClick={() => router.push("/login")}
                            style={{ color: "#5a2a08", cursor: "pointer", borderBottom: "1px dotted rgba(90,42,8,0.4)", fontStyle: "normal", fontWeight: 600 }}>
                            Begin your chronicle
                        </span>
                    </p>

                    <p className="font-im-fell" style={{ position: "absolute", bottom: 10, right: 16, fontSize: 11, color: "rgba(100,70,20,0.4)", fontStyle: "italic" }}>
                        pg. 1
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Register;