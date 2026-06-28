import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
function Dashboard(){
    const navigate = useNavigate();
    useEffect(()=>{
    const fetchProfile = async () => {
        try{
            const response = await api.get("accounts/profile/");
            console.log(response.data); 
        }
        catch(error){
            console.log(error);
        }
    };
    fetchProfile();
},[]);
const handleLogout = ()=>{
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/");
}
    return (
        <div>
    <h1>Dashboard</h1>
    <button onClick={handleLogout}>Logout</button>
        </div>
    );
}
export default Dashboard;