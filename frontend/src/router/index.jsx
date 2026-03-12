import { createBrowserRouter } from "react-router";
import Layout from "../layouts/Layout";
import Home from "../pages/Home";
import Users from "../pages/Users";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import ProtectedRoute from "../components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/login", element: <Login /> },
      {
        path: "/students",
        element: <ProtectedRoute><Users /></ProtectedRoute>,
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

