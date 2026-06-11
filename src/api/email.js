import axios from "axios";

export async function send(subject, message, attachments) {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/email/send`,
      { subject, message, attachments }
    );
    return response.data;
  } catch (error) {
    console.error("Email sending failed:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message || "Email sending failed. Please try again.",
    };
  }
}
