"use client";

import { useState } from "react";
import { LoginForm } from "@/components/login-form";
import { useNavigate } from "react-router-dom";
import logo from '@/assets/ava.jpeg'; 

export default function LoginPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    navigate("/admin/dashboard");
  };

  return (
    <div className="grid min-h-svh">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            {!isLoggedIn ? (
              <>
                <div className="mb-6 flex justify-center">
                  <img
                    src={logo}
                    alt="Avalift logo"
                    // className="h-44 w-auto"
                  />
                </div>
                <LoginForm onLoginSuccess={handleLoginSuccess} />
              </>
            ) : null}
          </div>
        </div>
      </div>
  );
}
