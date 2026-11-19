import { createBrowserRouter, Navigate, RouterProvider, useLocation } from "react-router";
import { useAuth } from "./lib/auth";
import AppShell from "./components/AppShell";
import { Spinner } from "./components/ui";
import Landing from "./pages/Landing";
import About from "./pages/About";
import Support from "./pages/Support";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Overview from "./pages/manager/Overview";
import Runs from "./pages/manager/Runs";
import RunDetail from "./pages/manager/RunDetail";
import Records from "./pages/manager/Records";
import Staff from "./pages/manager/Staff";
import Structure from "./pages/manager/Structure";
import PayRules from "./pages/manager/PayRules";
import Audit from "./pages/manager/Audit";
import Users from "./pages/manager/Users";
import MyPay from "./pages/staff/MyPay";

function FullPageLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center gap-3 text-muted">
      <Spinner className="size-4" /> <span className="font-mono text-xs uppercase tracking-[0.14em]">Opening the ledger…</span>
    </div>
  );
}

function RequireAuth({ children, manager, superAdmin }) {
  const { status, isManager, isSuper } = useAuth();
  const location = useLocation();
  if (status === "loading") return <FullPageLoader />;
  if (status === "anon") return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if ((manager && !isManager) || (superAdmin && !isSuper)) return <Navigate to="/app" replace />;
  return children;
}

function Home() {
  const { isManager } = useAuth();
  return <Navigate to={isManager ? "/app/overview" : "/app/my-pay"} replace />;
}

const managerOnly = (el) => <RequireAuth manager>{el}</RequireAuth>;

const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/about", element: <About /> },
  { path: "/support", element: <Support /> },
  { path: "/login", element: <Login /> },
  {
    path: "/app",
    element: <RequireAuth><AppShell /></RequireAuth>,
    children: [
      { index: true, element: <Home /> },
      { path: "overview", element: managerOnly(<Overview />) },
      { path: "runs", element: managerOnly(<Runs />) },
      { path: "runs/:id", element: managerOnly(<RunDetail />) },
      { path: "payslips", element: managerOnly(<Records />) },
      { path: "staff", element: managerOnly(<Staff />) },
      { path: "structure", element: managerOnly(<Structure />) },
      { path: "rules", element: managerOnly(<PayRules />) },
      { path: "audit", element: managerOnly(<Audit />) },
      { path: "users", element: <RequireAuth superAdmin><Users /></RequireAuth> },
      { path: "my-pay", element: <MyPay /> },
      { path: "settings", element: <Settings /> },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
