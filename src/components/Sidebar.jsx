import { useContext, useEffect, useState } from "react";
import chatIcon from "../assets/chat.png";
import botIcon from "../assets/bot.png";
import teamIcon from "../assets/group.png";
import timeLine from "../assets/process.png";
import timeLineDark from "../assets/process_dark.png";
import todo from "../assets/calendar.png";
import { Tooltip, SideSheet, List, Badge } from "@douyinfe/semi-ui";
import {
  BotMessageContext,
  MessageContext,
  SettingsContext,
  UndoRedoContext,
} from "../pages/Editor";
import Todo from "./Todo";
import Chat from "./Chat";
import DrawBot from "./DrawBot";

export default function Sidebar() {
  const SidesheetType = {
    NONE: 0,
    CHAT: 1,
    TEAM: 2,
    TODO: 3,
    TIMELINE: 4,
    BOT: 5,
  };
  const { undoStack } = useContext(UndoRedoContext);
  const { messages } = useContext(MessageContext);
  const { settings } = useContext(SettingsContext);
  const { botMessages } = useContext(BotMessageContext);
  const [sidesheet, setSidesheet] = useState(SidesheetType.NONE);
  const [seen, setSeen] = useState(0);
  const [seenBot, setSeenBot] = useState(0);
  const [count, setCount] = useState(messages.length - seen);
  const [botCount, setBotCount] = useState(botMessages.length - seenBot);

  const getTitle = (type) => {
    switch (type) {
      case SidesheetType.TIMELINE:
        return (
          <div className="flex items-center">
            <img
              src={settings.mode === "light" ? timeLine : timeLineDark}
              className="w-7"
              alt="chat icon"
            />
            <div className="ms-3 text-lg">Timeline</div>
          </div>
        );
      case SidesheetType.CHAT:
        return (
          <div className="flex items-center">
            <img src={chatIcon} className="w-7" alt="chat icon" />
            <div className="ms-3 text-lg">Chat</div>
          </div>
        );
      case SidesheetType.TODO:
        return (
          <div className="flex items-center">
            <img src={todo} className="w-7" alt="todo icon" />
            <div className="ms-3 text-lg">To-do list</div>
          </div>
        );
      case SidesheetType.BOT:
        return (
          <div className="flex items-center">
            <img src={botIcon} className="w-7" alt="todo icon" />
            <div className="ms-3 text-lg">drawBOT</div>
          </div>
        );
      default:
        break;
    }
  };

  const getContent = (type) => {
    switch (type) {
      case SidesheetType.TIMELINE:
        return renderTimeline();
      case SidesheetType.TODO:
        return <Todo />;
      case SidesheetType.CHAT:
        return <Chat />;
      case SidesheetType.BOT:
        return <DrawBot />;
      default:
        break;
    }
  };

  useEffect(() => {
    if (sidesheet !== SidesheetType.CHAT) {
      setCount(messages.length - seen);
    }
    if (sidesheet !== SidesheetType.BOT) {
      setBotCount(botMessages.length - seenBot);
    }
  }, [
    sidesheet,
    seen,
    messages.length,
    SidesheetType.CHAT,
    seenBot,
    botMessages.length,
    SidesheetType.BOT,
  ]);

  return (
    <>
      <div className="ps-3 pe-4 py-4 shadow-lg h-full select-none border-l border-color">
        <Tooltip content="Chat">
          <Badge
            count={count === 0 ? null : count}
            overflowCount={99}
            type="danger"
          >
            <button
              className="block"
              onClick={() => {
                setSidesheet(SidesheetType.CHAT);
                setSeen(messages.length);
              }}
            >
              <img src={chatIcon} className="w-8 mb-5" alt="chat icon" />
            </button>
          </Badge>
        </Tooltip>
        <Tooltip content="Team">
          <button className="block">
            <img src={teamIcon} className="w-8 mb-5" alt="chat icon" />
          </button>
        </Tooltip>
        <Tooltip content="To-do">
          <button
            className="block"
            onClick={() => setSidesheet(SidesheetType.TODO)}
          >
            <img src={todo} className="w-8 mb-5" alt="todo icon" />
          </button>
        </Tooltip>
        <Tooltip content="Timeline">
          <button
            className="block"
            onClick={() => setSidesheet(SidesheetType.TIMELINE)}
          >
            <img
              src={settings.mode === "light" ? timeLine : timeLineDark}
              className="w-8 mb-5"
              alt="chat icon"
            />
          </button>
        </Tooltip>
        <Tooltip content="drawBOT">
          <Badge
            count={botCount === 0 ? null : botCount}
            overflowCount={99}
            type="danger"
          >
            <button
              className="block"
              onClick={() => {
                setSidesheet(SidesheetType.BOT);
                setSeenBot(botMessages.length);
              }}
            >
              <img src={botIcon} className="w-8 mb-5" alt="chat icon" />
            </button>
          </Badge>
        </Tooltip>
      </div>
      <SideSheet
        visible={sidesheet !== SidesheetType.NONE}
        onCancel={() => {
          if (sidesheet === SidesheetType.CHAT) {
            setSeen(messages.length);
          } else if (sidesheet === SidesheetType.BOT) {
            setSeenBot(botMessages.length);
          }
          setSidesheet(SidesheetType.NONE);
        }}
        width={340}
        title={getTitle(sidesheet)}
        style={{ paddingBottom: "16px" }}
        bodyStyle={{ padding: "0px" }}
      >
        {getContent(sidesheet)}
      </SideSheet>
    </>
  );

  function renderTimeline() {
    if (undoStack.length > 0) {
      return (
        <List className="sidesheet-theme">
          {[...undoStack].reverse().map((e, i) => (
            <List.Item
              key={i}
              style={{ padding: "4px 18px 4px 18px" }}
              className="hover-1"
            >
              <div className="flex items-center py-1 w-full">
                <i className="block fa-regular fa-circle fa-xs"></i>
                <div className="ms-2">{e.message}</div>
              </div>
            </List.Item>
          ))}
        </List>
      );
    } else {
      return (
        <div className="m-5 sidesheet-theme">
          No activity was recorded. You have not added anything to your diagram
          yet.
        </div>
      );
    }
  }
}
