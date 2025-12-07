import axios from "axios";

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

http.interceptors.request.use((config) => {
  // ✅ if caller sets this flag, do NOT attach Authorization
  const skipAuth = (config.headers as any)?.["X-Skip-Auth"];

  config.headers = config.headers ?? {};
  (config.headers as any).Accept = "application/json";

  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;
  if (!isFormData && !(config.headers as any)["Content-Type"]) {
    (config.headers as any)["Content-Type"] = "application/json";
  }

  if (!skipAuth) {
    const token = getToken();
    if (token) (config.headers as any).Authorization = `Bearer ${token}`;
  } else {
    // remove the hint header before sending
    delete (config.headers as any)["X-Skip-Auth"];
  }

  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.replace("/unauthorized");
    }
    return Promise.reject(err);
  }
);

export default http;
