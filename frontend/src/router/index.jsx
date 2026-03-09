import { createBrowserRouter } from "react-router";
import Layout from "../layouts/Layout";
import Home from "../pages/Home";
import Register from "../pages/Register";
import Users from "../pages/Users";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/users",
        element: <Users />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);
