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
import Dashboard from "../pages/Dashboard";
import GradesManage from "../pages/GradesManage";
import StudentGrades from "../pages/StudentGrades";
import ScheduleView from "../pages/ScheduleView";
import ScheduleManage from "../pages/ScheduleManage";
import InvoicesList from "../pages/InvoicesList";
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
      { path: "/dashboard",              element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
      { path: "/grades",                  element: <ProtectedRoute><GradesManage /></ProtectedRoute> },
      { path: "/schedule",                element: <ProtectedRoute><ScheduleView /></ProtectedRoute> },
      { path: "/schedule/manage",         element: <ProtectedRoute><ScheduleManage /></ProtectedRoute> },
      { path: "/students",               element: <ProtectedRoute><Users /></ProtectedRoute> },
      { path: "/students/create",        element: <ProtectedRoute><StudentCreate /></ProtectedRoute> },
      { path: "/students/:id/edit",      element: <ProtectedRoute><StudentEdit /></ProtectedRoute> },
      { path: "/students/:id/grades",    element: <ProtectedRoute><StudentGrades /></ProtectedRoute> },
      { path: "/teachers",            element: <ProtectedRoute><TeachersList /></ProtectedRoute> },
      { path: "/teachers/create",     element: <ProtectedRoute><TeacherCreate /></ProtectedRoute> },
      { path: "/teachers/:id/edit",   element: <ProtectedRoute><TeacherEdit /></ProtectedRoute> },
      { path: "/classrooms",           element: <ProtectedRoute><ClassroomsList /></ProtectedRoute> },
      { path: "/classrooms/create",    element: <ProtectedRoute><ClassroomCreate /></ProtectedRoute> },
      { path: "/classrooms/:id",       element: <ProtectedRoute><ClassroomShow /></ProtectedRoute> },
      { path: "/classrooms/:id/edit",  element: <ProtectedRoute><ClassroomEdit /></ProtectedRoute> },
      { path: "/invoices",             element: <ProtectedRoute><InvoicesList /></ProtectedRoute> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

