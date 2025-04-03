import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000",
});

export const saveImage = (image: string) => API.post("/save-image", { image });
export const getImages = () => API.get("/get-images");
export const loadImage = (filename: string) => API.get(`/saved_images/${filename}`);
