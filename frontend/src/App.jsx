import { BrowserRouter,Routes,Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";   
import ProtectedRoute from "./components/common/ProtectedRoute";
function App() {
    return (
        <BrowserRouter>
        <Routes>
            <Route path="/" element = {<Login />}/>
            <Route path="/dashboard" element ={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
        </Routes>
        </BrowserRouter>
    );
}

export default App;