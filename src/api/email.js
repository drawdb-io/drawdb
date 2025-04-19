import axios from "axios";

export async function send(subject, message, attachments) {
  return await axios.post(`${import.meta.env.VITE_BACKEND_URL}/email/send`, {
    subject,
    message,
    attachments,
  });
}
