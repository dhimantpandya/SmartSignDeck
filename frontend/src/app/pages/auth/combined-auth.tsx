import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Routes } from "@/utilities/routes";
import { UserAuthForm } from "./components/user-auth-form";
import { SignUpForm } from "./components/sign-up-form";
import "./auth-animations.css";

export default function CombinedAuthPage() {
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);

    // Determine if we are on the signup page based on the URL
    const isSignup = location.pathname === Routes.SIGN_UP;

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Scroll to top of the panel when switching between sign-in and sign-up
    useEffect(() => {
        window.scrollTo(0, 0);
        const panels = document.querySelectorAll('.credentials-panel');
        panels.forEach(panel => {
            panel.scrollTo({ top: 0, behavior: 'auto' });
        });
    }, [location.pathname]);

    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className={`auth-wrapper ${isSignup ? "toggled" : ""}`}>
                {/* Visual Elements - Only for non-mobile to save RAM/CPU */}
                {!isMobile && (
                    <>
                        <div className="background-shape"></div>
                        <div className="secondary-shape"></div>
                    </>
                )}

                {/* Sign In Form Panel */}
                <div className="credentials-panel signin">
                    <h2 className="slide-element">Login</h2>
                    <div className="slide-element w-full">
                        <UserAuthForm />
                    </div>
                    {/* Mobile Only: Sign Up Link */}
                    {isMobile && (
                        <div className="text-center mt-6">
                            <p className="text-xs text-white/60 mb-2">Don't have an account?</p>
                            <Link to={Routes.SIGN_UP} className="text-xs font-bold text-[#00d4ff] uppercase tracking-wider">
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>

                {/* Welcome Back Section (Next to Sign In Form) */}
                <div className="welcome-section signin">
                    <h2 className="slide-element">WELCOME BACK!</h2>
                    <p className="slide-element">Enter your personal details and start your journey with us.</p>
                    <div className="slide-element text-center">
                        <p className="account-prompt">Don't have an account?</p>
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
                    {/* Mobile Only: Sign In Link */}
                    {isMobile && (
                        <div className="text-center mt-6">
                            <p className="text-xs text-white/60 mb-2">Already have an account?</p>
                            <Link to={Routes.SIGN_IN} className="text-xs font-bold text-[#00d4ff] uppercase tracking-wider">
                                Sign In
                            </Link>
                        </div>
                    )}
                </div>

                {/* Welcome Section (Next to Sign Up Form) */}
                <div className="welcome-section signup">
                    <h2 className="slide-element">WELCOME!</h2>
                    <p className="slide-element">Please register to get started with your new journey.</p>
                    <div className="slide-element text-center">
                        <p className="account-prompt">Already have an account?</p>
                        <Link
                            className="switch-btn flex items-center justify-center no-underline pointer-events-auto cursor-pointer"
                            to="/sign-in"
                        >
                            SIGN IN
                        </Link>
                    </div>
                </div>
            </div>

        </div>
    );
}
