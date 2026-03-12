
import { RouterProvider } from "react-router";
import { router } from "./router/index.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import './App.css'

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App
