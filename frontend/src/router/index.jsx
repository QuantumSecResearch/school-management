import { createBrowserRouter } from "react-router";
import Layout from "../layouts/Layout";
import Home from "../pages/Home";
import Users from "../pages/Users";
import StudentCreate from "../pages/StudentCreate";
import StudentEdit from "../pages/StudentEdit";
import TeachersList from "../pages/TeachersList";
import TeacherCreate from "../pages/TeacherCreate";
import TeacherEdit from "../pages/TeacherEdit";
import ClassroomsList from "../pages/ClassroomsList";
import ClassroomCreate from "../pages/ClassroomCreate";
import ClassroomEdit from "../pages/ClassroomEdit";
import ClassroomShow from "../pages/ClassroomShow";
import Login from "../pages/Login";
import Register from "../pages/Register";
import NotFound from "../pages/NotFound";
import ProtectedRoute from "../components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/students",            element: <ProtectedRoute><Users /></ProtectedRoute> },
      { path: "/students/create",     element: <ProtectedRoute><StudentCreate /></ProtectedRoute> },
      { path: "/students/:id/edit",   element: <ProtectedRoute><StudentEdit /></ProtectedRoute> },
      { path: "/teachers",            element: <ProtectedRoute><TeachersList /></ProtectedRoute> },
      { path: "/teachers/create",     element: <ProtectedRoute><TeacherCreate /></ProtectedRoute> },
      { path: "/teachers/:id/edit",   element: <ProtectedRoute><TeacherEdit /></ProtectedRoute> },
      { path: "/classrooms",           element: <ProtectedRoute><ClassroomsList /></ProtectedRoute> },
      { path: "/classrooms/create",    element: <ProtectedRoute><ClassroomCreate /></ProtectedRoute> },
      { path: "/classrooms/:id",       element: <ProtectedRoute><ClassroomShow /></ProtectedRoute> },
      { path: "/classrooms/:id/edit",  element: <ProtectedRoute><ClassroomEdit /></ProtectedRoute> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

