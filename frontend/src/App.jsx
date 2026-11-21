import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Overview from "./pages/Overview";
import Accounts from "./pages/Accounts";
import AccountDetail from "./pages/AccountDetail";
import MoveMoney from "./pages/MoveMoney";
import Activity from "./pages/Activity";
import Payees from "./pages/Payees";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

/** Signed-in pages: redirect to /login (remembering where you were going). */
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

function RequireAdmin({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/overview" replace />;
}

/** Signed-out pages: skip them if you're already signed in. */
function GuestOnly({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/overview" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route path="/overview" element={<Overview />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/accounts/:accountNumber" element={<AccountDetail />} />
        <Route path="/move" element={<MoveMoney />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/payees" element={<Payees />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
        {/* old URLs from the previous version */}
        <Route path="/dashboard" element={<Navigate to="/overview" replace />} />
        <Route path="/transfer" element={<Navigate to="/move" replace />} />
        <Route path="/transactions" element={<Navigate to="/activity" replace />} />
        <Route path="/accounts/create" element={<Navigate to="/accounts?new=1" replace />} />
      </Route>

      <Route path="/" element={<Navigate to="/overview" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
