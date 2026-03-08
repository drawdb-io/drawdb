import { useState, useRef, useEffect, useMemo } from "react";
import { Button, Input, Toast } from "@douyinfe/semi-ui";
import { IconLink, IconStop, IconPlay } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { nanoid } from "nanoid";
import { generateRandomName } from "../utils";
import {
  useAreas,
  useCollab,
  useDiagram,
  useEnums,
  useNotes,
  useTransform,
  useTypes,
} from "../../../../hooks";
import { useSearchParams } from "react-router-dom";
import { databases } from "../../../../data/databases";

const deriveKey = async (secret) => {
  const raw = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("your-app-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
};

export default function LiveCollaboration({ title, setTitle }) {
  const { t } = useTranslation();
  let [searchParams, setSearchParams] = useSearchParams();
  const [name, setName] = useState(
    localStorage.getItem("username") || generateRandomName(),
  );
  const {
    initSocket,
    roomId,
    secretKey: contextSecretKey,
    disconnectSocket,
    isApplyingRemoteRef,
  } = useCollab();

  const {
    tables,
    relationships,
    database,
    setTables,
    setRelationships,
    setDatabase,
  } = useDiagram();
  const { notes, setNotes } = useNotes();
  const { areas, setAreas } = useAreas();
  const { types, setTypes } = useTypes();
  const { enums, setEnums } = useEnums();
  const { transform, setTransform } = useTransform();
  const [secretKey, setSecretKey] = useState(contextSecretKey || nanoid());
  const [connecting, setConnecting] = useState(false);

  const roomKeyRef = useRef(null);

  const link = useMemo(() => {
    if (!roomId) return "";
    return `${window.location.origin}/editor?room=${roomId}#${secretKey}`;
  }, [roomId, secretKey]);

  const handleStartSession = async () => {
    setConnecting(true);
    try {
      roomKeyRef.current = await deriveKey(secretKey);

      initSocket(
        name,
        secretKey,
        {
          onConnect: (roomId) => {
            window.history.replaceState(
              {},
              "",
              `${window.location.pathname}?room=${roomId}#${secretKey}`,
            );
            setConnecting(false);
          },
          onConnectError: (err) => {
            Toast.error(`Failed to connect: ${err.message}`);
            setConnecting(false);
          },
          onDisconnect: () => {},
          onReceiveDiagram: (payload) => {
            if (!payload) return;

            console.log("payload", payload);

            const {
              title,
              tables,
              relationships,
              notes,
              subjectAreas,
              database,
              types,
              enums,
              transform,
            } = payload;
            isApplyingRemoteRef.current = true;

            setTitle(title);
            setTables(tables);
            setRelationships(relationships);
            setNotes(notes);
            setAreas(subjectAreas);
            setDatabase(database);
            if (types) {
              setTypes(types);
            }
            if (enums) {
              setEnums(enums);
            }
            if (transform) {
              setTransform(transform);
            }

            setTimeout(() => {
              isApplyingRemoteRef.current = false;
            }, 0);
          },
        },
        () => {
          return {
            title,
            tables: tables,
            relationships: relationships,
            notes: notes,
            subjectAreas: areas,
            database: database,
            ...(databases[database].hasTypes && { types: types }),
            ...(databases[database].hasEnums && { enums: enums }),
            transform: transform,
          };
        },
      );
    } catch (err) {
      console.error(err);
      Toast.error("Failed to start session");
      setConnecting(false);
    }
  };

  const handleStopSession = () => {
    disconnectSocket();
    searchParams.delete("room");
    window.location.hash = "";
    setSearchParams(searchParams, { replace: true });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(link);
    Toast.success(t("link_copied"));
  };

  useEffect(() => {
    localStorage.setItem("username", name);
  }, [name]);

  return (
    <div className="space-y-3">
      <div>
        <div className="font-semibold mb-2">{t("your_name")}</div>
        <Input
          size="large"
          value={name}
          onChange={setName}
          className="block w-full"
          disabled={!!link}
        />
      </div>

      <div>
        <div className="font-semibold mb-2">{t("secret_key")}</div>
        <Input
          size="large"
          value={secretKey}
          className="block w-full"
          onChange={(v) => setSecretKey(v)}
          disabled={!!link}
        />
      </div>

      {link && (
        <div>
          <div className="font-semibold mb-2">{t("link")}</div>
          <div className="flex items-center gap-3">
            <Input
              size="large"
              readonly
              className="block w-full"
              value={link}
            />
            <Button
              theme="solid"
              size="large"
              icon={<IconLink />}
              onClick={handleCopyLink}
            >
              {t("copy_link")}
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 border-b border-neutral-500 mt-5" />
      <div>
        You can set the secret key to have your data encrypted before sending to
        the server. This way, only people with the key can access the diagram
        content.
      </div>

      {!link ? (
        <div className="flex justify-center mt-5">
          <Button
            size="large"
            theme="solid"
            icon={<IconPlay />}
            onClick={handleStartSession}
            loading={connecting}
          >
            {t("start_session")}
          </Button>
        </div>
      ) : (
        <div className="flex justify-center mt-5">
          <Button
            size="large"
            theme="solid"
            icon={<IconStop />}
            type="danger"
            onClick={handleStopSession}
          >
            {t("disconnect")}
          </Button>
        </div>
      )}
    </div>
  );
}
