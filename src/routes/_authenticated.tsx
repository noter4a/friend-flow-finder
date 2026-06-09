import {
  createFileRoute,
  Outlet,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { Sparkles, LogOut, Users, LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAuthUser } from "@/lib/api/auth.functions";
import { logoutFn } from "@/lib/api/auth.functions";
import type { AuthUser } from "@/router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const user = await getAuthUser();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    return { user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext() as { user: AuthUser };
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutFn();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="border-b border-border/60 backdrop-blur-xl bg-background/70 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                className="size-9 rounded-xl grid place-items-center"
                style={{
                  background: "var(--gradient-primary)",
                  boxShadow: "var(--shadow-glow)",
                }}
              >
                <Sparkles className="size-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-base font-semibold tracking-tight">
                  Гури
                </h1>
                <p className="text-xs text-muted-foreground -mt-0.5">
                  Clientes & comissões
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition text-muted-foreground hover:text-foreground hover:bg-card [&.active]:bg-card [&.active]:text-foreground [&.active]:shadow-sm [&.active]:border [&.active]:border-border/70"
              >
                <LayoutDashboard className="size-3.5" /> Clientes
              </Link>
              {user.role === "admin" && (
                <Link
                  to="/admin/users"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition text-muted-foreground hover:text-foreground hover:bg-card [&.active]:bg-card [&.active]:text-foreground [&.active]:shadow-sm [&.active]:border [&.active]:border-border/70"
                >
                  <Shield className="size-3.5" /> Usuários
                </Link>
              )}
            </nav>
          </div>

          {/* User area */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium">{user.name}</p>
              <div className="flex items-center gap-1.5 justify-end">
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                >
                  {user.role === "admin" ? "Admin" : "Usuário"}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handleLogout}
              title="Sair"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <Outlet />
    </div>
  );
}
