import axios from "axios";
import { MessageRequest, MessageResponse } from "@/types/chat";

const baseURL = process.env.AGENTS_URL;
console.log("BASE_URL");
console.log(baseURL);

const api = axios.create({
  baseURL: `${baseURL}/api`, // Next.jsのプロキシを使用
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

export const chatApi = {
  sendMessage: async (request: MessageRequest): Promise<MessageResponse> => {
    const response = await api.post<MessageResponse>("/chat", request);
    return response.data;
  },

  healthCheck: async (): Promise<{ status: string }> => {
    const response = await api.get("/health");
    return response.data;
  },
};

export default api;
