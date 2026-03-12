import { createBrowserRouter } from "react-router";
import Layout from "../layouts/Layout";
import Home from "../pages/Home";
import Users from "../pages/Users";
import StudentCreate from "../pages/StudentCreate";
import StudentEdit from "../pages/StudentEdit";
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
      {
        path: "/students/create",
        element: <ProtectedRoute><StudentCreate /></ProtectedRoute>,
      },
      {
        path: "/students/:id/edit",
        element: <ProtectedRoute><StudentEdit /></ProtectedRoute>,
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

