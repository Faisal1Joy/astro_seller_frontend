"use client";
import { Toaster } from "react-hot-toast";
import Navigation from "./Navigation";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isauthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      {isauthenticated && pathname !== "/login" && pathname !== "/signup" && (
        <Navigation />
      )}{" "}
      <main>{children}</main>
    </div>
  );
}
