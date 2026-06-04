import { BrowserRouter } from "react-router-dom";
import ThemeSync from "./components/ThemeSync.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import AppRoutes from "./routes/AppRoutes";

const App = () => (
  <BrowserRouter>
    <ThemeSync />
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
