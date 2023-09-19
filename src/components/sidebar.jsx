import React, { useContext, useState } from "react";
import chatIcon from "../assets/chat.png";
import botIcon from "../assets/bot.png";
import teamIcon from "../assets/group.png";
import timeLine from "../assets/process.png";
import todo from "../assets/calendar.png";
import { Tooltip, SideSheet, List } from "@douyinfe/semi-ui";
import { UndoRedoContext } from "../pages/editor";
import Todo from "./todo";
import Chat from "./chat";

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
  const [sidesheet, setSidesheet] = useState(SidesheetType.NONE);

  const getTitle = (type) => {
    switch (type) {
      case SidesheetType.TIMELINE:
        return (
          <div className="flex items-center">
            <img src={timeLine} className="w-7" alt="chat icon" />
            <div className="ms-3">Timeline</div>
          </div>
        );
      case SidesheetType.CHAT:
        return (
          <div className="flex items-center">
            <img src={chatIcon} className="w-7" alt="chat icon" />
            <div className="ms-3">Chat</div>
          </div>
        );
      case SidesheetType.TODO:
        return (
          <div className="flex items-center">
            <img src={todo} className="w-7" alt="todo icon" />
            <div className="ms-3">To-do list</div>
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
      default:
        break;
    }
  };

  return (
    <>
      <div className="px-3 py-3 shadow-lg h-full select-none">
        <Tooltip content="Chat">
          <button
            className="block"
            onClick={() => setSidesheet(SidesheetType.CHAT)}
          >
            <img src={chatIcon} className="w-8 mb-5" alt="chat icon" />
          </button>
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
            <img src={timeLine} className="w-8 mb-5" alt="chat icon" />
          </button>
        </Tooltip>
        <Tooltip content="Botle">
          <button className="block">
            <img src={botIcon} className="w-8 mb-5" alt="chat icon" />
          </button>
        </Tooltip>
      </div>
      <SideSheet
        visible={sidesheet !== SidesheetType.NONE}
        onCancel={() => {
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
        <List>
          {[...undoStack].reverse().map((e) => (
            <List.Item
              style={{ padding: "4px 18px 4px 18px" }}
              className="hover:bg-slate-100"
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
        <div className="m-5">
          You havent added anything to your diagram yet.
        </div>
      );
    }
  }
}
