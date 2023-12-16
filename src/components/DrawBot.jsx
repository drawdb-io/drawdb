import { useContext, useState } from "react";
import { Button, Input, Avatar } from "@douyinfe/semi-ui";
import { IconSend } from "@douyinfe/semi-icons";
import { BotMessageContext } from "../pages/Editor";
import botIcon from "../assets/bot.png";

export default function DrawBot() {
  const [message, setMessage] = useState("");
  const { botMessages } = useContext(BotMessageContext);

  return (
    <div className="mx-5 flex flex-col h-full sidesheet-theme">
      <div className="h-full flex-1 overflow-y-auto flex flex-col-reverse py-2">
        {botMessages.map((m, i) => (
          <div key={i} className="flex pt-1">
            <Avatar size="small" src={botIcon}>
              {m.sender === "bot" ? "drawBOT" : "You"}
            </Avatar>
            <div className="ms-2">
              <div className="font-semibold">
                {m.sender === "bot" ? "drawBOT" : "You"}
              </div>
              <div>{m.message}</div>
            </div>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();

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
