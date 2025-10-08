import axios from "axios";

const api = axios.create({
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api; 