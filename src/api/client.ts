// src/api/client.ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

// 연결 테스트용
export const getExampleList = async () => {
  const res = await api.get("/api/example");
  return res.data;
};