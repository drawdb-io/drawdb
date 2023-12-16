import { useContext, useState } from "react";
import { Button, Input, Tag, Avatar } from "@douyinfe/semi-ui";
import { IconSend } from "@douyinfe/semi-icons";
import { socket } from "../data/socket";
import { MessageContext } from "../pages/Editor";

export default function Chat() {
  const [message, setMessage] = useState("");
  const { messages } = useContext(MessageContext);

  return (
    <div className="mx-5 flex flex-col h-full sidesheet-theme">
      <div className="h-full flex-1 overflow-y-auto flex flex-col-reverse py-2">
        {messages.map((m, i) =>
          m.type === "note" ? (
            <div key={i} className="text-center my-1">
              <Tag size="large" color={m.action === "join" ? "blue" : "amber"}>
                {m.message}
              </Tag>
            </div>
          ) : messages[i + 1].id !== m.id ? (
            <div key={i} className="flex pt-1">
              <Avatar
                size="small"
                alt={m.name}
                color={m.color}
                className="border border-color"
              >
                {m.name.split(" ").map((c) => c[0])}
              </Avatar>
              <div className="ms-2">
                <div className="font-semibold">{m.name}</div>
                <div>{m.message}</div>
              </div>
            </div>
          ) : (
            <div key={i} className="ms-10">
              {m.message}
            </div>
          )
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (message.trim() !== "") {
            socket.emit("send-message", message);
          }
          setMessage("");
        }}
        className="flex mt-2"
      >
        <Input
          onChange={(v) => setMessage(v)}
          placeholder="Message"
          value={message}
          autoComplete="off"
          className="me-2"
        ></Input>
        <Button icon={<IconSend />} htmlType="submit"></Button>
      </form>
    </div>
  );
}
