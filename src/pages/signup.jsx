import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/icon_dark_64.png";
import google_logo from "../assets/google.png";
import github_logo from "../assets/github.png";
import axios from "axios";
import { Cardinality } from "../data/data";
import { calcPath } from "../utils";
import { Toast } from "@douyinfe/semi-ui";

const xOffset = window.innerWidth * 0.42 * 0.15;
const diagram = {
  tables: [
    {
      name: "galactic_users",
      x: xOffset + 101,
      y: window.innerHeight * 0.75 - (4 * 36 + 50 + 7) * 0.5,
      fields: [
        {
          name: "id",
          type: "INT",
        },
        {
          name: "username",
          type: "VARCHAR",
        },
        {
          name: "email",
          type: "VARCHAR",
        },
        {
          name: "password",
          type: "VARCHAR",
        },
      ],
      color: "#7d9dff",
    },
    {
      name: "celestial_data",
      x: xOffset,
      y: window.innerHeight * 0.32 - (5 * 36 + 50 + 7) * 0.5,
      fields: [
        {
          name: "id",
          type: "INT",
        },
        {
          name: "user_id",
          type: "INT",
        },
        {
          name: "type",
          type: "ENUM",
        },
        {
          name: "time",
          type: "TIMESTAMP",
        },
        {
          name: "content",
          type: "VARCHAR",
        },
      ],
      color: "#89e667",
    },
  ],
  relationships: [
    {
      startTableId: 1,
      startFieldId: 1,
      endTableId: 0,
      endFieldId: 0,
      startX: xOffset + 16,
      startY:
        window.innerHeight * 0.32 - (4 * 36 + 50 + 7) * 0.5 + (50 + 18 * 2),
      endX: xOffset + 115,
      endY: window.innerHeight * 0.75 - (4 * 36 + 50 + 7) * 0.5 + (50 + 18 * 1),
      cardinality: "One to one",
    },
  ],
};

function Table({ table, grab }) {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredField, setHoveredField] = useState(-1);
  const height = table.fields.length * 36 + 50 + 7;
  return (
    <foreignObject
      key={table.name}
      x={table.x}
      y={table.y}
      width={200}
      height={height}
      className="drop-shadow-lg rounded-md cursor-move"
      onMouseDown={grab}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`border-2 ${
          isHovered ? "border-dashed border-blue-500" : "border-zinc-300"
        } select-none rounded-lg w-full bg-zinc-100 text-zinc-800`}
      >
        <div
          className={`h-[10px] w-full rounded-t-md`}
          style={{ backgroundColor: table.color }}
        />
        <div className="font-bold h-[40px] flex justify-between items-center border-b border-zinc-400 bg-zinc-200 px-3">
          {table.name}
        </div>
        {table.fields.map((e, i) => (
          <div
            key={i}
            className={`${
              i === table.fields.length - 1 ? "" : "border-b border-gray-400"
            } h-[36px] px-2 py-1 flex justify-between`}
            onMouseEnter={() => setHoveredField(i)}
            onMouseLeave={() => setHoveredField(-1)}
          >
            <div className={hoveredField === i ? "text-zinc-500" : ""}>
              <button
                className={`w-[9px] h-[9px] bg-[#2f68ad] opacity-80 z-50 rounded-full me-2`}
              />
              {e.name}
            </div>
            <div className="text-zinc-400">{e.type}</div>
          </div>
        ))}
      </div>
    </foreignObject>
  );
}

function Relationship({ relationship }) {
  const pathRef = useRef();
  let start = { x: 0, y: 0 };
  let end = { x: 0, y: 0 };

  let cardinalityStart = "1";
  let cardinalityEnd = "1";

  switch (relationship.cardinality) {
    case Cardinality.MANY_TO_ONE:
      cardinalityStart = "n";
      cardinalityEnd = "1";
      break;
    case Cardinality.ONE_TO_MANY:
      cardinalityStart = "1";
      cardinalityEnd = "n";
      break;
    case Cardinality.ONE_TO_ONE:
      cardinalityStart = "1";
      cardinalityEnd = "1";
      break;
    default:
      break;
  }

  const length = 32;

  const [refAquired, setRefAquired] = useState(false);
  useEffect(() => {
    setRefAquired(true);
  }, []);

  if (refAquired) {
    const pathLength = pathRef.current.getTotalLength();
    const point1 = pathRef.current.getPointAtLength(length);
    start = { x: point1.x, y: point1.y };
    const point2 = pathRef.current.getPointAtLength(pathLength - length);
    end = { x: point2.x, y: point2.y };
  }

  return (
    <g className="select-none" onClick={() => console.log(pathRef.current)}>
      <path
        ref={pathRef}
        d={calcPath(
          relationship.startX,
          relationship.endX,
          relationship.startY,
          relationship.endY,
          relationship.startFieldId,
          relationship.endFieldId
        )}
        stroke="gray"
        fill="none"
        strokeWidth={2}
      />
      {pathRef.current && (
        <>
          <circle cx={start.x} cy={start.y} r="12" fill="grey"></circle>
          <text
            x={start.x}
            y={start.y}
            fill="white"
            strokeWidth="0.5"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {cardinalityStart}
          </text>
          <circle cx={end.x} cy={end.y} r="12" fill="grey"></circle>
          <text
            x={end.x}
            y={end.y}
            fill="white"
            strokeWidth="0.5"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {cardinalityEnd}
          </text>
        </>
      )}
    </g>
  );
}

function Canvas() {
  const [tables, setTables] = useState(diagram.tables);
  const [relationships, setRelationships] = useState(diagram.relationships);
  const [dragging, setDragging] = useState(-1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const grabTable = (e, id) => {
    setDragging(id);
    setOffset({
      x: e.clientX - tables[id].x,
      y: e.clientY - tables[id].y,
    });
  };

  const moveTable = (e) => {
    if (dragging !== -1) {
      const dx = e.clientX - offset.x;
      const dy = e.clientY - offset.y;
      setTables((prev) =>
        prev.map((table, i) => {
          if (i === dragging) {
            setRelationships((prev) =>
              prev.map((r) => {
                if (r.startTableId === i) {
                  return {
                    ...r,
                    startX: dx + 15,
                    startY: dy + r.startFieldId * 36 + 69,
                    endX: tables[r.endTableId].x + 15,
                    endY: tables[r.endTableId].y + r.endFieldId * 36 + 69,
                  };
                } else if (r.endTableId === i) {
                  return {
                    ...r,
                    startX: tables[r.startTableId].x + 15,
                    startY: tables[r.startTableId].y + r.startFieldId * 36 + 69,
                    endX: dx + 15,
                    endY: dy + r.endFieldId * 36 + 69,
                  };
                }
                return r;
              })
            );

            return {
              ...table,
              x: dx,
              y: dy,
            };
          }
          return table;
        })
      );
    }
  };

  const releaseTable = () => {
    setDragging(-1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <svg
      className="w-full h-full cursor-grab"
      onMouseUp={releaseTable}
      onMouseMove={moveTable}
      onMouseLeave={releaseTable}
    >
      <defs>
        <pattern
          id="pattern-circles"
          x="0"
          y="0"
          width="22"
          height="22"
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
        >
          <circle
            id="pattern-circle"
            cx="4"
            cy="4"
            r="0.85"
            fill="rgb(99, 152, 191)"
          ></circle>
        </pattern>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="url(#pattern-circles)"
      ></rect>
      {tables.map((t, i) => (
        <Table key={i} table={t} grab={(e) => grabTable(e, i)} />
      ))}
      {relationships.map((r, i) => (
        <Relationship key={i} relationship={r} />
      ))}
    </svg>
  );
}

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
        <Canvas />
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
