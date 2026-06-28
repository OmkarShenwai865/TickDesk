import axios from "axios"

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/"
})
//request interceptor
api.interceptors.request.use(
(config) =>{
    const token = localStorage.getItem("access");
    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
},
(error) => {
        return Promise.reject(error);       
}  
);

//response interceptor
api.interceptors.response.use(
    (response) => response,
    async(error) => {
        const originalRequest = error.config;
        if(
            error.response?.status == 401 && !originalRequest._retry
        ){
            originalRequest._retry = true;
            try{
                const refresh= localStorage.getItem("refresh");
                const response = await axios.post(
                    "http://127.0.0.1:8000/api/accounts/refresh/",
                    {
                        refresh : refresh,
                    }
                );
                const newAccess = response.data.access;

                localStorage.setItem("access", newAccess);

                originalRequest.headers.Authorization =
                    `Bearer ${newAccess}`;

                return api(originalRequest);
            }
            catch(refreshError){
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
                window.location.href = "/";

                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;