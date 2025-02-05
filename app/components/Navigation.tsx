"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("authToken");

    router.push("/login");
  };
  return (
    <nav className="bg-sky-950 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard">
                <span className="text-xl font-bold text-indigo-600">Astro</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {[
                { href: "/dashboard", label: "Dashboard" },
                { href: "/dashboard/products", label: "Products" },
                { href: "/dashboard/orders", label: "Orders" },
                { href: "/dashboard/inventory", label: "Inventory" },
                { href: "/dashboard/profile", label: "Profile" },
                {
                  href: "/dashboard/customer-interaction",
                  label: "Customer Interaction",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === item.href
                      ? "border-indigo-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              <button
                onClick={handleLogout}
                className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
