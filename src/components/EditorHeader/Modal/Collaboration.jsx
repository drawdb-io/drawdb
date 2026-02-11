import { Button, Input, Toast, Banner, Spin } from "@douyinfe/semi-ui";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    IconLink,
    IconUpload,
    IconDownload,
    IconExit,
    IconPlay,
    IconUserGroup,
} from "@douyinfe/semi-icons";
import {
    useAreas,
    useDiagram,
    useEnums,
    useNotes,
    useTransform,
    useTypes,
} from "../../../hooks";
import { databases } from "../../../data/databases";
import { createSession, getSession, updateSession } from "../../../api/collaboration";
import { nanoid } from "nanoid";
import { DB } from "../../../data/constants";

export default function Collaboration({ setModal }) {
    const { t } = useTranslation();

    // Diagram State Hooks
    const { tables, setTables, relationships, setRelationships, database, setDatabase } = useDiagram();
    const { notes, setNotes } = useNotes();
    const { areas, setAreas } = useAreas();
    const { types, setTypes } = useTypes();
    const { enums, setEnums } = useEnums();
    const { transform, setTransform } = useTransform();

    // Local State
    const [sessionId, setSessionId] = useState(localStorage.getItem("drawdb_session_id") || "");
    const [loading, setLoading] = useState(false);
    const [inputSessionId, setInputSessionId] = useState("");
    const [error, setError] = useState(null);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    useEffect(() => {
        if (sessionId) {
            localStorage.setItem("drawdb_session_id", sessionId);
        } else {
            localStorage.removeItem("drawdb_session_id");
        }
    }, [sessionId]);

    const getDiagramJSON = useCallback(() => {
        return {
            title: "Collaboration Session", // We might want to sync title too, but keeping it simple
            tables,
            relationships,
            notes,
            subjectAreas: areas,
            database,
            ...(databases[database]?.hasTypes && { types }),
            ...(databases[database]?.hasEnums && { enums }),
            transform,
        };
    }, [tables, relationships, notes, areas, database, types, enums, transform]);

    const loadDiagramJSON = (data) => {
        try {
            if (data.database) {
                setDatabase(data.database);
            } else {
                setDatabase(DB.GENERIC);
            }

            setTables(data.tables || []);
            setRelationships(data.relationships || []);
            setNotes(data.notes || []);
            setAreas(data.subjectAreas || []);

            if (data.transform) {
                setTransform(data.transform);
            }

            if (databases[data.database || DB.GENERIC].hasTypes) {
                setTypes(data.types || []);
            }

            if (databases[data.database || DB.GENERIC].hasEnums) {
                setEnums(data.enums || []);
            }

            Toast.success(t("sync.pull_success") || "Diagram updated from session!");
            setLastSyncTime(new Date());
        } catch (e) {
            console.error(e);
            setError("Failed to load diagram data.");
        }
    };

    const handeCreateSession = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = getDiagramJSON();
            const id = await createSession(data);
            setSessionId(id);
            Toast.success("Session created!");
        } catch (e) {
            setError(e.message || "Failed to create session");
        } finally {
            setLoading(false);
        }
    };

    const handleJoinSession = async () => {
        if (!inputSessionId) return;
        setLoading(true);
        setError(null);
        try {
            // Establish existence
            await getSession(inputSessionId);
            setSessionId(inputSessionId);
            Toast.success("Joined session!");
        } catch (e) {
            setError("Session not found or error connecting.");
        } finally {
            setLoading(false);
        }
    };

    const handlePush = async () => {
        if (!sessionId) return;
        setLoading(true);
        try {
            const data = getDiagramJSON();
            await updateSession(sessionId, data);
            setLastSyncTime(new Date());
            Toast.success("Changes pushed to session!");
        } catch (e) {
            setError("Failed to push changes.");
        } finally {
            setLoading(false);
        }
    };

    const handlePull = async () => {
        if (!sessionId) return;
        if (!window.confirm("This will overwrite your current local changes. Are you sure?")) {
            return;
        }
        setLoading(true);
        try {
            const data = await getSession(sessionId);
            loadDiagramJSON(data);
        } catch (e) {
            setError("Failed to pull changes.");
        } finally {
            setLoading(false);
        }
    };

    const handleLeave = () => {
        setSessionId("");
        setLastSyncTime(null);
        Toast.info("Left session");
    };

    const sessionUrl = window.location.origin + window.location.pathname + "?session=" + sessionId;

    const copyLink = () => {
        navigator.clipboard.writeText(sessionUrl).then(() => {
            Toast.success("Link copied!");
        });
    };

    const copyId = () => {
        navigator.clipboard.writeText(sessionId).then(() => {
            Toast.success("ID copied!");
        });
    };

    return (
        <div className="p-2">
            <div className="text-lg font-bold mb-4 flex items-center gap-2">
                <IconUserGroup /> Collaboration (Beta)
            </div>

            {error && (
                <Banner
                    type="danger"
                    description={error}
                    closeIcon={null}
                    className="mb-4"
                />
            )}

            {loading && (
                <div className="flex justify-center my-4">
                    <Spin size="large" />
                </div>
            )}

            {!sessionId ? (
                <div className="flex flex-col gap-4">
                    <div className="p-4 border rounded bg-gray-50 dark:bg-gray-700">
                        <h3 className="font-semibold mb-2">Start a new session</h3>
                        <p className="text-sm text-gray-500 mb-3">
                            Create a shared session from your current diagram.
                        </p>
                        <Button theme="solid" icon={<IconPlay />} onClick={handeCreateSession} block>
                            Create Session
                        </Button>
                    </div>

                    <div className="text-center text-gray-400">- OR -</div>

                    <div className="p-4 border rounded bg-gray-50 dark:bg-gray-700">
                        <h3 className="font-semibold mb-2">Join existing session</h3>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter Session ID"
                                value={inputSessionId}
                                onChange={setInputSessionId}
                            />
                            <Button onClick={handleJoinSession}>Join</Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-100 dark:border-blue-800">
                        <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Session Active</div>
                        <div className="flex gap-2 mb-2">
                            <Input value={sessionId} readonly size="small" />
                            <Button icon={<IconLink />} onClick={copyId} title="Copy ID" />
                        </div>
                        <div className="flex gap-2">
                            <Input value={sessionUrl} readonly size="small" />
                            <Button icon={<IconLink />} onClick={copyLink} title="Copy Link" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            theme="solid"
                            type="primary"
                            icon={<IconUpload />}
                            onClick={handlePush}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Push My Changes
                        </Button>
                        <Button
                            theme="solid"
                            type="warning"
                            icon={<IconDownload />}
                            onClick={handlePull}
                        >
                            Pull Latest
                        </Button>
                    </div>

                    {lastSyncTime && (
                        <div className="text-xs text-center text-gray-400">
                            Last synced: {lastSyncTime.toLocaleTimeString()}
                        </div>
                    )}

                    <div className="border-t mt-2 pt-4">
                        <Button type="danger" theme="light" icon={<IconExit />} onClick={handleLeave} block>
                            Leave Session
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
