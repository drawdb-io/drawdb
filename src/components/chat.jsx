import React, { useContext, useState } from "react";
import { Button, Input } from "@douyinfe/semi-ui";
import { IconSend } from "@douyinfe/semi-icons";
import { socket } from "../data/socket";
import { MessageContext } from "../pages/editor";

export default function Chat() {
  const [message, setMessage] = useState("");
  const { messages, setMessages } = useContext(MessageContext);

  return (
    <div className="mx-5 flex flex-col h-full">
      <div className="h-full flex-1 overflow-y-auto" id="message-box">
        {messages.map((m, i) => (
          <div key={i}>{m}</div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (message !== "") {
            setMessages((prev) => [...prev, message]);
            socket.emit("send-message", message);
          }
          setMessage("");
        }}
        className="flex"
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
