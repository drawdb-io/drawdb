import React from "react";
import { useCollab } from "../../../hooks";
import { Avatar, AvatarGroup, Popover } from "@douyinfe/semi-ui";

export default function CollabUsers() {
  const { currentUsers } = useCollab();

  if (!currentUsers || currentUsers?.length === 0) return null;

  const renderMore = (restNumber, restAvatars) => {
    const content = restAvatars.map((avatar, index) => {
      return (
        <div className="flex items-center gap-2 popover-theme" key={index}>
          {React.cloneElement(avatar, {
            size: "small",
            color: avatar.props.color,
          })}
          <span>{avatar.props.alt}</span>
        </div>
      );
    });
    return (
      <Popover
        content={<div className="space-y-2">{content}</div>}
        autoAdjustOverflow={false}
        position={"bottomRight"}
        style={{ padding: "8px 12px" }}
      >
        <Avatar size="small">{`+${restNumber}`}</Avatar>
      </Popover>
    );
  };

  return (
    <AvatarGroup maxCount={3} size="small" renderMore={renderMore}>
      {currentUsers.map((user) => (
        <Avatar key={user.name} alt={user.name} color={user.color}>
          {user.name[0].toUpperCase()}
        </Avatar>
      ))}
    </AvatarGroup>
  );
}
