import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/react.svg";
import { useAuth } from "@/context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(56,189,248,0.16),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.12),transparent_35%)]" />
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <NavLink to="/" className="flex min-w-0 items-center gap-3">
            <img
              src={logo}
              alt="School Management Logo"
              className="h-9 w-9 rounded-md border bg-card p-1.5 shadow-sm"
            />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold leading-none tracking-tight sm:text-lg">
                School Management
              </p>
              <p className="truncate text-xs text-muted-foreground">Student Platform</p>
            </div>
          </NavLink>

          <nav className="flex items-center gap-2 rounded-xl border bg-card/70 p-1.5 shadow-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")
              }>
              Home
            </NavLink>

            {user ? (
              // Connecté
              <>
                <NavLink to="/dashboard" className={({ isActive }) =>
                  cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")
                }>Dashboard</NavLink>
                <NavLink to="/students" className={({ isActive }) =>
                  cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")
                }>Students</NavLink>
                <NavLink to="/teachers" className={({ isActive }) =>
                  cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")
                }>Teachers</NavLink>
                <NavLink to="/schedule" className={({ isActive }) =>
                  cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")
                }>Emploi</NavLink>
                <NavLink to="/grades" className={({ isActive }) =>
                  cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")
                }>Notes</NavLink>
                <NavLink to="/classrooms" className={({ isActive }) =>
                  cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")
                }>Classes</NavLink>
                <NavLink to="/invoices" className={({ isActive }) =>
                  cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")
                }>Paiements</NavLink>
              </>
            ) : (
              // Non connecté : afficher Login + Register
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")
                  }>
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")
                  }>
                  Register
                </NavLink>
              </>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {user && (
              <>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user.name}
                </span>
                <Button variant="outline" size="icon" onClick={handleLogout} aria-label="Logout">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="icon"
              aria-label="Toggle dark mode"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun /> : <Moon />}
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <section className="rounded-2xl border bg-card/80 p-6 shadow-sm">
          <Outlet />
        </section>
      </main>
      <footer className="mx-auto w-full max-w-6xl px-4 pb-6 text-sm text-muted-foreground" />
    </div>
  );
}
