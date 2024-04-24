import axios from 'axios';
const gptService = axios.create({
    baseURL: import.meta.env.VITE_SERVER
})

gptService.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

gptService.interceptors.response.use(
    (response) => {
        const result = response.data;
        return result;
    },
    (error) => {
        return Promise.reject(error);
    }
);
export default gptService;
