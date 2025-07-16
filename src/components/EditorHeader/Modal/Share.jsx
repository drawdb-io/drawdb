import { Banner, Button, Input, Spin, Toast } from "@douyinfe/semi-ui";
import { useCallback, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IdContext } from "../../Workspace";
import { IconLink } from "@douyinfe/semi-icons";
import {
  useAreas,
  useDiagram,
  useEnums,
  useNotes,
  useTransform,
  useTypes,
} from "../../../hooks";
import { databases } from "../../../data/databases";
import { MODAL } from "../../../data/constants";
import { create, del, patch } from "../../../api/gists";

export default function Share({ title, setModal }) {
  const { t } = useTranslation();
  const { gistId, setGistId } = useContext(IdContext);
  const [loading, setLoading] = useState(true);
  const { tables, relationships, database } = useDiagram();
  const { notes } = useNotes();
  const { areas } = useAreas();
  const { types } = useTypes();
  const { enums } = useEnums();
  const { transform } = useTransform();
  const [error, setError] = useState(null);
  const url =
    window.location.origin + window.location.pathname + "?shareId=" + gistId;

  const diagramToString = useCallback(() => {
    return JSON.stringify({
      title,
      tables: tables,
      relationships: relationships,
      notes: notes,
      subjectAreas: areas,
      database: database,
      ...(databases[database].hasTypes && { types: types }),
      ...(databases[database].hasEnums && { enums: enums }),
      transform: transform,
    });
  }, [
    areas,
    notes,
    tables,
    relationships,
    database,
    title,
    enums,
    types,
    transform,
  ]);

  const unshare = useCallback(async () => {
    try {
      await del(gistId);
      setGistId("");
      setModal(MODAL.NONE);
    } catch (e) {
      console.error(e);
      setError(e);
    }
  }, [gistId, setGistId, setModal]);

  useEffect(() => {
    const updateOrGenerateLink = async () => {
      try {
        setLoading(true);
        if (!gistId || gistId === "") {
          const id = await create(diagramToString());
          setGistId(id);
        } else {
          await patch(gistId, diagramToString());
        }
      } catch (e) {
        console.error(e);
        setError(e);
      } finally {
        setLoading(false);
      }
    };
    updateOrGenerateLink();
  }, [gistId, diagramToString, setGistId]);

  const copyLink = () => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        Toast.success(t("copied_to_clipboard"));
      })
      .catch(() => {
        Toast.error(t("oops_smth_went_wrong"));
      });
  };

  if (loading)
    return (
      <div className="text-blue-500 text-center">
        <Spin size="middle" />
        <div>{t("loading")}</div>
      </div>
    );

  return (
    <div>
      {error && (
        <Banner
          description={t("oops_smth_went_wrong")}
          type="danger"
          closeIcon={null}
          fullMode={false}
        />
      )}
      {!error && (
        <>
          <div className="flex gap-3">
            <Input value={url} size="large" />
          </div>
          <div className="text-xs mt-2">{t("share_info")}</div>
          <div className="flex gap-2 mt-3">
            <Button block onClick={unshare}>
              {t("unshare")}
            </Button>
            <Button block theme="solid" icon={<IconLink />} onClick={copyLink}>
              {t("copy_link")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
