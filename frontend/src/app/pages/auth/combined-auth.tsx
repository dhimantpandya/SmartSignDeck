import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Routes } from "@/utilities/routes";
import { UserAuthForm } from "./components/user-auth-form";
import { SignUpForm } from "./components/sign-up-form";
import "./auth-animations.css";

export default function CombinedAuthPage() {
    const location = useLocation();

    // Determine if we are on the signup page based on the URL
    const isSignup = location.pathname === Routes.SIGN_UP;

    // Scroll to top of the panel when switching between sign-in and sign-up
    useEffect(() => {
        window.scrollTo(0, 0);
        const panels = document.querySelectorAll('.credentials-panel');
        panels.forEach(panel => {
            panel.scrollTo({ top: 0, behavior: 'auto' });
        });
    }, [location.pathname]);

    return (
        <div className="auth-page-container">
            <div className={`auth-wrapper ${isSignup ? "toggled" : ""}`}>
                {/* Visual Elements */}
                <div className="background-shape"></div>
                <div className="secondary-shape"></div>

                {/* Sign In Form Panel */}
                <div className="credentials-panel signin">
                    <h2 className="slide-element">Login</h2>
                    <div className="slide-element w-full">
                        <UserAuthForm />
                    </div>
                </div>

                {/* Welcome Back Section (Next to Sign In Form) */}
                <div className="welcome-section signin">
                    <h2 className="slide-element">WELCOME BACK!</h2>
                    <p className="slide-element">Enter your personal details and start your journey with us.</p>
                    <div className="slide-element">
                        <Link
                            className="switch-btn flex items-center justify-center no-underline pointer-events-auto cursor-pointer"
                            to="/sign-up"
                        >
                            SIGN UP
                        </Link>
                    </div>
                </div>

                {/* Sign Up Form Panel */}
                <div className="credentials-panel signup">
                    <h2 className="slide-element">Register</h2>
                    <div className="slide-element w-full">
                        <SignUpForm />
                    </div>
                </div>

                {/* Welcome Section (Next to Sign Up Form) */}
                <div className="welcome-section signup">
                    <h2 className="slide-element">WELCOME!</h2>
                    <p className="slide-element">Please register to get started with your new journey.</p>
                    <div className="slide-element">
                        <Link
                            className="switch-btn flex items-center justify-center no-underline pointer-events-auto cursor-pointer"
                            to="/sign-in"
                        >
                            SIGN IN
                        </Link>
                    </div>
                </div>
            </div>

            {/* Reference Footer - can be kept or swapped later */}
            <div className="footer">
                <p>SmartSignDeck © 2026 | Digital Signage Excellence</p>
            </div>
        </div>
    );
}
