import { useState, useEffect } from "react";
import "../../styles/Login.css";
import api from "../../services/api"; 
import {FaEye,FaEyeSlash} from "react-icons/fa";  
import {useNavigate} from "react-router-dom";
function Login(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword,setShowPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType,setMessageType]= useState("");
    const navigate = useNavigate();
    useEffect(()=>{
        const token = localStorage.getItem("access");
        if(token){
            navigate("/dashboard");
        }
    },[navigate]);
    const handleLogin = async ()=> {
    try{
        const response = await api.post("accounts/login/", {
            username: email,
            password: password,
        });
        // console.log(response.data);
        localStorage.setItem("access", response.data.access);
        localStorage.setItem("refresh", response.data.refresh);
        setMessage("Login Successful!");
        setMessageType("success");  
        setTimeout(()=>{
             navigate("/dashboard");
        },1000);
       
        console.log("Login Successful");
    }
    catch(error){
        // console.error(error.response?.data || error.message);
          setMessage("Invalid Username or Password");
          setMessageType("error");

          console.log(error);
    }
};
    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Tickdesk</h1>
                <p>IT Helpdesk and Asset Management System</p>
                <div className="form-group">
                    <label>Email <span style={{color:"red"}}>*</span></label>
                    <input type="email" placeholder="Enter your email" value={email}
                    onChange={(e)=>setEmail(e.target.value)} required/>
                </div>
                <div className="form-group">
                    <label>Password <span style={{color:"red"}}>*</span></label>
                    <div className="password-container">
                    <input type={showPassword ? "text" : "password"} placeholder="Enter password" value={password}
                     onChange={(e)=>setPassword(e.target.value)}
                    required/>
                <span 
                className="password-toggle"
                onClick={()=> setShowPassword(!showPassword)}
                >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
                    </div>
                </div>
                {message && (
                    <div className={`message ${messageType}`}>{message}</div>
                )}
                <button onClick={handleLogin}>Login</button>
            </div>
        </div>
    );
}
export default Login;