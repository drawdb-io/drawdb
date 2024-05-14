import { Row, Col, Button, Collapse } from "@douyinfe/semi-ui";
import { IconPlus } from "@douyinfe/semi-icons";
import { useNotes, useSelect } from "../../../hooks";
import Empty from "../Empty";
import SearchBar from "./SearchBar";
import NoteInfo from "./NoteInfo";
import {useTranslation} from "react-i18next";

export default function NotesTab() {
  const { t } = useTranslation();
  const { notes, addNote } = useNotes();
  const { selectedElement, setSelectedElement } = useSelect();

  return (
    <>
      <Row gutter={6}>
        <Col span={16}>
          <SearchBar
            setActiveKey={(activeKey) =>
              setSelectedElement((prev) => ({
                ...prev,
                id: parseInt(activeKey),
              }))
            }
          />
        </Col>
        <Col span={8}>
          <Button icon={<IconPlus />} block onClick={() => addNote()}>
              {t("Page.editor.SidePanel.Notes.Add note")}
          </Button>
        </Col>
      </Row>
      {notes.length <= 0 ? (
        <Empty title={t("Page.editor.SidePanel.Notes.No text notes")} text={t("Page.editor.SidePanel.Notes.Add notes cuz why not")} />
      ) : (
        <Collapse
          activeKey={selectedElement.open ? `${selectedElement.id}` : ""}
          onChange={(activeKey) => {
            setSelectedElement((prev) => ({
              ...prev,
              id: parseInt(activeKey),
              open: true,
            }));
          }}
          accordion
        >
          {notes.map((n, i) => (
            <NoteInfo data={n} key={i} nid={i} />
          ))}
        </Collapse>
      )}
    </>
  );
}
