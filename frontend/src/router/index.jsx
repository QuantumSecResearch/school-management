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
import RoleRoute from "../components/RoleRoute";

// Rôles "scolarité" : admin legacy + super_admin + school_admin + director (lecture)
const ACADEMIC_ROLES    = ["admin", "super_admin", "school_admin", "director"];
const ACADEMIC_WRITE    = ["admin", "super_admin", "school_admin"];
const FINANCE_ROLES     = ["admin", "super_admin", "finance_manager", "student"];
const GRADES_ROLES      = ["admin", "super_admin", "school_admin", "teacher"];
const SCHEDULE_VIEW     = ["admin", "super_admin", "school_admin", "director", "teacher", "student"];
const SCHEDULE_WRITE    = ["admin", "super_admin", "school_admin"];

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/login",    element: <Login /> },
      { path: "/register", element: <Register /> },

      // Accessible à tous les rôles connectés
      { path: "/dashboard", element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
      { path: "/schedule",  element: <RoleRoute roles={SCHEDULE_VIEW}><ScheduleView /></RoleRoute> },

      // Notes : super_admin + school_admin + teacher + admin
      {
        path: "/grades",
        element: <RoleRoute roles={GRADES_ROLES}><GradesManage /></RoleRoute>,
      },
      {
        path: "/students/:id/grades",
        element: <ProtectedRoute><StudentGrades /></ProtectedRoute>,
      },

      // Emploi du temps (gestion) : écriture académique
      {
        path: "/schedule/manage",
        element: <RoleRoute roles={SCHEDULE_WRITE}><ScheduleManage /></RoleRoute>,
      },

      // Élèves : lecture académique + teacher, écriture académique
      { path: "/students",          element: <RoleRoute roles={[...ACADEMIC_ROLES, "teacher"]}><Users /></RoleRoute> },
      { path: "/students/create",   element: <RoleRoute roles={ACADEMIC_WRITE}><StudentCreate /></RoleRoute> },
      { path: "/students/:id/edit", element: <RoleRoute roles={ACADEMIC_WRITE}><StudentEdit /></RoleRoute> },

      // Professeurs : lecture académique, écriture académique
      { path: "/teachers",          element: <RoleRoute roles={ACADEMIC_ROLES}><TeachersList /></RoleRoute> },
      { path: "/teachers/create",   element: <RoleRoute roles={ACADEMIC_WRITE}><TeacherCreate /></RoleRoute> },
      { path: "/teachers/:id/edit", element: <RoleRoute roles={ACADEMIC_WRITE}><TeacherEdit /></RoleRoute> },

      // Classes : lecture académique + teacher, écriture académique
      { path: "/classrooms",          element: <RoleRoute roles={[...ACADEMIC_ROLES, "teacher"]}><ClassroomsList /></RoleRoute> },
      { path: "/classrooms/create",   element: <RoleRoute roles={ACADEMIC_WRITE}><ClassroomCreate /></RoleRoute> },
      { path: "/classrooms/:id",      element: <RoleRoute roles={[...ACADEMIC_ROLES, "teacher"]}><ClassroomShow /></RoleRoute> },
      { path: "/classrooms/:id/edit", element: <RoleRoute roles={ACADEMIC_WRITE}><ClassroomEdit /></RoleRoute> },

      // Factures : finance + admin + student (student voit les siennes via le backend)
      { path: "/invoices", element: <RoleRoute roles={FINANCE_ROLES}><InvoicesList /></RoleRoute> },

      { path: "*", element: <NotFound /> },
    ],
  },
]);

