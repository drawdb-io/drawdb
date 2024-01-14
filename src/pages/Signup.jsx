import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/icon_dark_64.png";
import google_logo from "../assets/google.png";
import github_logo from "../assets/github.png";
import axios from "axios";
import { Toast } from "@douyinfe/semi-ui";
import Canvas from "../components/AuthCanvas";
import { diagram } from "../data/signupDiagram";

export default function SignUp() {
  const [formValues, setFormValues] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showVerified, setShowVerified] = useState(false);
  const [resendCounter, setResendCounter] = useState(0);

  const handleChange = (e) =>
    setFormValues((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

  const onSubmit = async () => {
    await axios
      .post(`${import.meta.env.VITE_API_BACKEND_URL}/signup`, {
        username: formValues.username,
        email: formValues.email,
        password: formValues.password,
      })
      .then(() => setShowVerified(true))
      .catch(() => {});
  };

  const resendEmail = async () => {
    await axios
      .post(`${import.meta.env.VITE_API_BACKEND_URL}/resend`, {
        username: formValues.username,
        email: formValues.email,
        password: formValues.password,
      })
      .then(() => setResendCounter((prev) => prev + 1))
      .catch((e) => {
        if (e.response.status === 400)
          Toast.error("Account has already been verified.");
      });
  };

  useEffect(() => {
    document.title = "Create account | drawDB";
  });

  return (
    <div className="grid grid-cols-7 h-screen bg-white">
      <div className="bg-white col-span-3 sm:hidden md:hidden lg:col-span-3 overflow-y-hidden relative">
        <Canvas diagram={diagram} />
        <Link to="/">
          <img src={logo} className="absolute left-0 top-0 p-3" width={56} />
        </Link>
      </div>
      <div className="col-span-4 rounded-l-[2rem] bg-white sm:col-span-full md:col-span-full flex flex-col justify-center items-center border border-zinc-200 shadow-xl z-10">
        <div className="w-[64%] sm:w-[80%] md:w-[72%]">
          {!showVerified ? (
            <>
              <div className="text-2xl font-bold text-zinc-800 tracking-wide">
                Create Account
              </div>
              <div className="flex items-center my-6 gap-4 font-semibold text-sm">
                <button className="w-full flex gap-2 justify-center items-center px-3 py-2 rounded-md border border-zinc-300 hover:bg-neutral-100 transition-all duration-300">
                  <img src={google_logo} width={22} />
                  <div>Sign up with Google</div>
                </button>
                <button className="w-full flex gap-2 justify-center items-center px-3 py-2 rounded-md border border-zinc-300 hover:bg-neutral-100 transition-all duration-300">
                  <img src={github_logo} width={22} />
                  <div>Sign up with Github</div>
                </button>
              </div>
              <div className="flex items-center justify-center my-1">
                <hr className="border-zinc-300 flex-grow" />
                <div className="mx-2 text-zinc-500">or</div>
                <hr className="border-zinc-300 flex-grow" />
              </div>
              <div>
                <label
                  className="font-semibold text-zinc-600 text-sm"
                  htmlFor="username"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  className="py-2 px-3 block w-full mb-0.5 border rounded border-zinc-400 border-opacity-70 hover:shadow focus:outline-blue-600"
                  onChange={handleChange}
                />
                <label
                  className="font-semibold text-zinc-600 text-sm"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  className="py-2 px-3 block w-full mb-0.5 border rounded border-zinc-400 border-opacity-70 hover:shadow focus:outline-blue-600"
                  onChange={handleChange}
                />
                <label
                  className="font-semibold text-zinc-600 text-sm"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="mb-3 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="py-2 ps-3 pe-10 block w-full border rounded border-zinc-400 border-opacity-70 hover:shadow focus:outline-blue-600"
                    onChange={handleChange}
                  />
                  <button
                    className="absolute right-3 top-[50%] translate-y-[-50%] text-blue-900 text-lg"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <i className="bi bi-eye-fill"></i>
                    ) : (
                      <i className="bi bi-eye-slash-fill"></i>
                    )}
                  </button>
                </div>
                <button
                  className="w-full px-3 py-2.5 mt-4 mb-2 bg-[#386b8f] hover:bg-[#467ba1] rounded-md text-white font-semibold"
                  onClick={onSubmit}
                >
                  Sign up
                </button>
                <div className="text-sm">
                  Already have an account?
                  <Link
                    to="/login"
                    className="ms-2 font-semibold text-indigo-700 hover:underline"
                  >
                    Log in here.
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-zinc-800 tracking-wide">
                Verify Account
              </div>
              <div className="my-6 space-y-1.5">
                <div>
                  We {resendCounter == 0 ? "sent" : "resent"} a verification
                  email to{" "}
                  <span className="text-blue-700 font-bold">
                    {formValues.email}
                  </span>
                  .
                </div>
                <div>Please check your inbox and verify your email.</div>
              </div>
              <div>
                <div className="font-bold">Don&apos;t see the email?</div>
                {resendCounter < 4 ? (
                  <div className="mt-1.5 text-sm leading-6">
                    If you haven&apos;t recieved the email after a few minutes,
                    make sure to check your junk mail or{" "}
                    <button
                      onClick={resendEmail}
                      className="text-blue-700 font-bold hover:underline"
                    >
                      resend verification
                    </button>
                    .
                  </div>
                ) : (
                  <div className="mt-1.5 text-sm leading-6">
                    Looks like we&apos;re having trouble signing you up. Please
                    try again in a little bit or contact us at{" "}
                    <a
                      href="mailto:hi"
                      className="text-blue-700 hover:underline font-bold"
                    >
                      drawdb@gmail.com
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
