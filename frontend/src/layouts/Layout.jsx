import { Outlet } from "react-router";
export default function Layout() {
    return <>
    <header> Header</header>
    <main>
        <Outlet />
    </main>
    <footer>Footer</footer>

 </>
}