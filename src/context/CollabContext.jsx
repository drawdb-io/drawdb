import { nanoid } from "nanoid";
import { createContext, useRef, useState } from "react";
import { io } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:5001";

export const CollabContext = createContext({
  inSession: false,
  currentUsers: [],
  socket: null,
  roomId: null,
  isApplyingRemoteRef: { current: false },
  deltaHandlerRef: { current: null },
  setInSession: () => {},
  setCurrentUsers: () => {},
});

export function CollabContextProvider({ children }) {
  const [inSession, setInSession] = useState(false);
  const [currentUsers, setCurrentUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [name, setName] = useState("");
  const [secretKey, setSecretKey] = useState(nanoid());
  const isApplyingRemoteRef = useRef(false);
  const deltaHandlerRef = useRef(null);

  const initSocket = (
    name,
    secretKey,
    { onConnect, onConnectError, onDisconnect, onReceiveDiagram } = {},
    constructPayload = () => {},
    roomId = null,
  ) => {
    const newRoomId = roomId || nanoid();

    setName(name);

    const userId = localStorage.getItem("userId") || crypto.randomUUID();
    localStorage.setItem("userId", userId);

    const newSocket = io(WS_URL, {
      autoConnect: false,
      auth: { name, roomId: newRoomId, userId },
    });

    newSocket.on("connect", () => {
      newSocket.emit("join_room", newRoomId);
      setRoomId(newRoomId);
      setSecretKey(secretKey);
      setInSession(true);
      onConnect?.(newRoomId);
    });

    newSocket.on("current_users", ({ users }) => {
      setCurrentUsers(users);
    });

    newSocket.on("user_joined", ({ user }) => {
      console.log("user_joined", user);
      setCurrentUsers((prev) => [...prev, user]);
    });

    newSocket.on("diagram_request", (data) => {
      newSocket.emit("diagram_response", {
        requesterId: data.requesterId,
        payload: constructPayload(),
      });
    });

    newSocket.on("diagram_response", (data) => {
      if (data) {
        onReceiveDiagram?.(data);
      }
    });

    newSocket.on("delta", (data) => {
      if (data) {
        deltaHandlerRef.current?.(data);
      }
    });

    newSocket.on("user_left", ({ userId }) => {
      setCurrentUsers((prev) => prev.filter((u) => u.userId !== userId));
    });

    newSocket.on("connect_error", (err) => {
      onConnectError?.(err);
    });

    newSocket.on("disconnect", (reason) => {
      if (
        reason === "io server disconnect" ||
        reason === "io client disconnect"
      ) {
        setInSession(false);
        setCurrentUsers([]);
        setSocket(null);
        onDisconnect?.(reason);
      }
    });

    setSocket(newSocket);

    newSocket.connect();
    return newSocket;
  };

  const disconnectSocket = () => {
    socket.disconnect();
    setSocket(null);
    setInSession(false);
    setCurrentUsers([]);
    setRoomId(null);
  };

  return (
    <CollabContext.Provider
      value={{
        inSession: inSession,
        currentUsers: currentUsers,
        socket: socket,
        name: name,
        roomId: roomId,
        secretKey: secretKey,
        isApplyingRemoteRef,
        deltaHandlerRef,
        setInSession: (value) => setInSession(value),
        setCurrentUsers: (value) => setCurrentUsers(value),
        initSocket,
        disconnectSocket,
      }}
    >
      {children}
    </CollabContext.Provider>
  );
}
