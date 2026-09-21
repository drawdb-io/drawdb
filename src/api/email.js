import axios from "axios";
import { getBackendUrl } from "../config/runtime.js";

export async function send(subject, message, attachments) {
  return await axios.post(`${getBackendUrl()}/email/send`, {
    subject,
    message,
    attachments,
  });
}
