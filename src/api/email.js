import axios from "axios";
import { backendUrl } from "../config";

export async function send(subject, message, attachments) {
  return await axios.post(`${backendUrl}/email/send`, {
    subject,
    message,
    attachments,
  });
}
