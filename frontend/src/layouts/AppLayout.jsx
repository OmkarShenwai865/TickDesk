import { Outlet } from "react-router-dom";



import Sidebar from "../components/layout/Sidebar";

import Navbar from "../components/layout/Navbar";



import "./AppLayout.css";



function AppLayout() {

    return (

        <div className="app-layout">

            <Sidebar />



            <div className="main-content">

                <Navbar />

                <Outlet />

            </div>

        </div>

    );

}



export default AppLayout;