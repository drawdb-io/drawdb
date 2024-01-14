import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/icon_dark_64.png";
import google_logo from "../assets/google.png";
import github_logo from "../assets/github.png";
import axios from "axios";
import Canvas from "../components/AuthCanvas";
import { diagram } from "../data/loginDiagram";

import { useCookies } from "react-cookie";

export default function Login() {
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [, setCookie] = useCookies(["logged_in", "username"]);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormValues((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

  const onSubmit = async () => {
    await axios
      .post(
        `${import.meta.env.VITE_API_BACKEND_URL}/login`,
        {
          email: formValues.email,
          password: formValues.password,
        },
        { withCredentials: true }
      )
      .then((res) => {
        setCookie("logged_in", true, {
          path: "/",
          expires: new Date(Date.parse(res.data.session.cookie.expires)),
        });
        setCookie("username", res.data.username, {
          path: "/",
          expires: new Date(Date.parse(res.data.session.cookie.expires)),
        });
        navigate("/");
      })
      .catch(() => {});
  };

  useEffect(() => {
    document.title = "Log in | drawDB";
  });

  return (
    <div className="grid grid-cols-7 h-screen bg-white">
      <div className="col-span-3 rounded-r-[2rem] bg-white sm:col-span-full md:col-span-full flex flex-col justify-center items-center border border-zinc-200 shadow-xl z-10">
        <div className="w-[70%] sm:w-[80%] md:w-[75%]">
          <div className="text-2xl font-bold text-zinc-800 tracking-wide">
            Welcome back!
          </div>
          <div className="flex items-center sm:block my-6 gap-4 font-semibold text-sm">
            <button className="sm:mb-2 w-full flex gap-2 justify-center items-center px-3 py-2 rounded-md border border-zinc-300 hover:bg-neutral-100 transition-all duration-300">
              <img src={google_logo} width={22} />
              <div>Log in with Google</div>
            </button>
            <button className="w-full flex gap-2 justify-center items-center px-3 py-2 rounded-md border border-zinc-300 hover:bg-neutral-100 transition-all duration-300">
              <img src={github_logo} width={22} />
              <div>Log in with Github</div>
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
              Log in
            </button>
            <div className="text-sm">
              Already have an account?
              <Link
                to="/signup"
                className="ms-2 font-semibold text-indigo-700 hover:underline"
              >
                Sign up here.
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white col-span-4 sm:hidden md:hidden overflow-y-hidden relative">
        <Canvas diagram={diagram} />
        <Link to="/">
          <img src={logo} className="absolute right-0 top-0 p-3" width={56} />
        </Link>
      </div>
    </div>
  );
}
