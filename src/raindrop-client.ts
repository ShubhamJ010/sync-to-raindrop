import axios from "axios";

export const raindropAxios = axios.create({
  baseURL: "https://api.raindrop.io/rest/v1",
  headers: {
    Authorization: `Bearer ${process.env.RAINDROP_TOKEN}`,
    "Content-Type": "application/json",
  },
});
