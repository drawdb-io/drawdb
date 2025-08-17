import { useCallback, useContext, useEffect, useState } from "react";
import { IdContext } from "../../Workspace";
import { useTranslation } from "react-i18next";
import { Button, IconButton, Spin, Steps, Tag, Toast } from "@douyinfe/semi-ui";
import {
  IconPlus,
  IconChevronRight,
  IconChevronLeft,
} from "@douyinfe/semi-icons";
import {
  create,
  getCommitsWithFile,
  getVersion,
  patch,
  get,
  VERSION_FILENAME,
} from "../../../api/gists";
import _ from "lodash";
import { DateTime } from "luxon";
import {
  useAreas,
  useDiagram,
  useEnums,
  useLayout,
  useNotes,
  useTransform,
  useTypes,
} from "../../../hooks";
import { databases } from "../../../data/databases";

export default function Versions({ open, title, setTitle }) {
  const { gistId, setGistId, setVersion } = useContext(IdContext);
  const { areas, setAreas } = useAreas();
  const { setLayout } = useLayout();
  const { database, tables, relationships, setTables, setRelationships } =
    useDiagram();
  const { notes, setNotes } = useNotes();
  const { types, setTypes } = useTypes();
  const { enums, setEnums } = useEnums();
  const { transform } = useTransform();
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [versions, setVersions] = useState([]);

  const diagramToString = useCallback(() => {
    return JSON.stringify({
      title,
      tables,
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

  const loadVersion = useCallback(
    async (sha) => {
      try {
        const version = await getVersion(gistId, sha);
        setVersion(sha);
        setLayout((prev) => ({ ...prev, readOnly: true }));

        const content = version.data.files[VERSION_FILENAME].content;

        const parsedDiagram = JSON.parse(content);

        setTables(parsedDiagram.tables);
        setRelationships(parsedDiagram.relationships);
        setAreas(parsedDiagram.subjectAreas);
        setNotes(parsedDiagram.notes);
        setTitle(parsedDiagram.title);

        if (databases[database].hasTypes) {
          setTypes(parsedDiagram.types);
        }

        if (databases[database].hasEnums) {
          setEnums(parsedDiagram.enums);
        }
      } catch (e) {
        console.log(e);
        Toast.error("failed_to_load_diagram");
      }
    },
    [
      gistId,
      setTables,
      setRelationships,
      setAreas,
      setVersion,
      setLayout,
      database,
      setNotes,
      setTypes,
      setEnums,
      setTitle,
    ],
  );

  const getRevisions = useCallback(
    async (gistId) => {
      try {
        setIsLoading(true);
        const { data } = await getCommitsWithFile(gistId, VERSION_FILENAME);
        setVersions(
          data.filter((version) => version.change_status.total !== 0),
        );
      } catch (e) {
        console.log(e);
        Toast.error(t("oops_smth_went_wrong"));
      } finally {
        setIsLoading(false);
      }
    },
    [t],
  );

  const hasDiagramChanged = async () => {
    const previousVersion = await get(gistId);
    const previousDiagram = JSON.parse(
      previousVersion.data.files[VERSION_FILENAME]?.content,
    );
    const currentDiagram = {
      title,
      tables,
      relationships: relationships,
      notes: notes,
      subjectAreas: areas,
      database: database,
      ...(databases[database].hasTypes && { types: types }),
      ...(databases[database].hasEnums && { enums: enums }),
      transform: transform,
    };

    return !_.isEqual(previousDiagram, currentDiagram);
  };

  const recordVersion = async () => {
    try {
      const hasChanges = await hasDiagramChanged();
      if (!hasChanges) {
        Toast.info(t("no_changes_to_record"));
        return;
      }
      if (gistId) {
        await patch(gistId, VERSION_FILENAME, diagramToString());
      } else {
        const id = await create(VERSION_FILENAME, diagramToString());
        setGistId(id);
      }
      await getRevisions(gistId);
    } catch (e) {
      Toast.error("failed_to_record_version");
    }
  };

  useEffect(() => {
    if (gistId && open) {
      getRevisions(gistId);
    }
  }, [gistId, getRevisions, open]);

  return (
    <div className="mx-5 relative h-full">
      <div className="sticky top-0 z-10 sidesheet-theme pb-2 flex gap-2">
        <IconButton icon={<IconChevronLeft />} title="Previous" />
        <Button icon={<IconPlus />} block onClick={recordVersion}>
          {t("record_version")}
        </Button>
        <IconButton icon={<IconChevronRight />} title="Next" />
      </div>
      {isLoading ? (
        <div className="text-blue-500 text-center mt-3">
          <Spin size="middle" />
          <div>{t("loading")}</div>
        </div>
      ) : (
        <>
          {(!gistId || !versions.length) && (
            <div className="my-3">{t("no_saved_versions")}</div>
          )}
          {gistId && (
            <div className="my-3 overflow-y-auto">
              <Steps direction="vertical" type="basic">
                {versions.map((r, i) => (
                  <Steps.Step
                    key={r.version}
                    onClick={() => loadVersion(r.version)}
                    title={
                      <div className="flex justify-between items-center w-full">
                        <span>{`${t("version")} ${versions.length - i}`}</span>
                        <Tag>{r.version.substring(0, 7)}</Tag>
                      </div>
                    }
                    description={`${t("commited_at")} ${DateTime.fromISO(
                      r.committed_at,
                    )
                      .setLocale(i18n.language)
                      .toLocaleString(DateTime.DATETIME_MED)}`}
                    icon={<i className="text-sm fa-solid fa-asterisk" />}
                  />
                ))}
              </Steps>
            </div>
          )}
        </>
      )}
    </div>
  );
}
