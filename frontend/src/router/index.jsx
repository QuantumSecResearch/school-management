import {createBrowserRouter} from "react-router";
import Home from "../pages/Home";
import Register from "../pages/Register";
import Users from "../pages/Users";


export const router = createBrowserRouter([
    {
        path: "/",
        element: <Home />
    },
    
    {
        path: "/register",
        element: <Register />
    },
     {
        path: "/users",
       element: <Users />
     },

]);