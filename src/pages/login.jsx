import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo_light_46.png";
import { IconEyeClosedSolid, IconEyeOpened } from "@douyinfe/semi-icons";
import axios from "axios";

export default function Login() {
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setFormValues((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

  const onSubmit = async () => {
    await axios
      .post(`${import.meta.env.VITE_API_BACKEND_URL}/login`, {
        email: formValues.email,
        password: formValues.password,
      })
      .then((res) => {
        console.log(res);
      })
      .catch(() => {});
  };

  useEffect(() => {
    document.title = "Log in | drawDB";
  });

  return (
    <div className="grid grid-cols-5 h-screen select-none">
      <div className="col-span-2 lg:col-span-3 sm:col-span-full md:col-span-full flex flex-col justify-center items-center my-6 mx-2">
        <Link to="/">
          <img src={logo} alt="logo" className="mx-auto h-[38px]" />
        </Link>
        <div className="text-lg my-1.5 text-center font-bold text-slate-600">
          Welcome back!
        </div>
        <div className="w-[54%] sm:w-[70%]">
          <label
            className="mb-0.5 text-sm font-bold text-slate-500"
            htmlFor="email"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            className="py-1.5 px-3 block w-full mb-1 border rounded border-slate-400 hover:shadow focus:outline-blue-500"
            onChange={handleChange}
          />
          <label
            className="mb-0.5 text-sm font-bold text-slate-500"
            htmlFor="password"
          >
            Password
          </label>
          <div className="flex items-center mb-3">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              className="py-1.5 px-3 block w-full border rounded-l border-slate-400 hover:shadow focus:outline-blue-500"
              onChange={handleChange}
            />
            <button
              className="bg-gray-200 py-1.5 px-2 rounded-r border border-slate-400"
              onClick={() => {
                setShowPassword((prev) => !prev);
              }}
            >
              {showPassword ? (
                <IconEyeOpened style={{ color: "rgb(22 74 110)" }} />
              ) : (
                <IconEyeClosedSolid style={{ color: "rgb(22 74 110)" }} />
              )}
            </button>
          </div>

          <button
            className="w-full px-3 py-2.5 my-2 bg-[#386b8f] hover:bg-[#4e8bb6] rounded text-white text-sm font-semibold"
            onClick={onSubmit}
          >
            Log in
          </button>
          <div className="text-sm text-center">
            Don&apos;t have an account?
            <Link
              to="/signup"
              className="ms-2 font-semibold text-indigo-700 hover:underline"
            >
              Sign up here.
            </Link>
          </div>
          <div className="flex items-center justify-center my-1">
            <hr className="border-slate-400 flex-grow" />
            <div className="text-sm font-semibold mx-2 text-slate-400">or</div>
            <hr className="border-slate-400 flex-grow" />
          </div>
          <button className="w-full px-3 py-2.5 mt-2 bg-[#386b8f] hover:bg-[#4e8bb6] rounded text-white text-sm font-semibold">
            Google
          </button>
          <button className="w-full px-3 py-2.5 my-2 bg-[#386b8f] hover:bg-[#4e8bb6] rounded text-white text-sm font-semibold">
            Github
          </button>
        </div>
      </div>
      <div className="bg-indigo-300 col-span-3 sm:hidden md:hidden lg:col-span-2 overflow-y-hidden"></div>
    </div>
  );
}
