import { useEffect, useState } from "react";
import { toPng, toJpeg, toSvg } from "html-to-image";
import { Image, Select, Spin } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { IMAGE_TYPES } from "../../../data/constants";
import ExportModal from "./ExportModal";

export default function ExportImage({ title, hideModal }) {
  const { t } = useTranslation();
  const [exportData, setExportData] = useState({
    data: null,
    filename: `${title}_${new Date().toISOString()}`,
    extension: IMAGE_TYPES[0],
  });

  const changeType = async (type) => {
    setExportData((prev) => ({
      ...prev,
      data: null,
      extension: type,
    }));

    const canvasElm = document.getElementById("canvas");

    let dataUrl;
    switch (type) {
      case "png":
        dataUrl = await toPng(canvasElm);
        break;
      case "jpeg":
        dataUrl = await toJpeg(canvasElm, { quality: 0.95 });
        break;
      case "svg":
        dataUrl = await toSvg(canvasElm, {
          filter: (node) => node.tagName !== "i",
        });
        break;
    }

    setExportData((prev) => ({
      ...prev,
      data: dataUrl,
    }));
  };

  useEffect(() => {
    changeType(IMAGE_TYPES[0]);
  }, []);

  return (
    <ExportModal
      modalTitle={t("export_image")}
      onCancel={hideModal}
      exportData={exportData}
      setExportData={setExportData}
    >
      <div className="font-semibold mb-1">{t("format")}:</div>
      <Select
        className="w-full mb-2"
        optionList={IMAGE_TYPES.map((type) => ({
          label: type.toUpperCase(),
          value: type,
        }))}
        value={exportData.extension}
        onChange={changeType}
      />
      <div className="text-center my-3 h-[280px] flex flex-col justify-center items-center">
        {exportData.data ? (
          <Image
            src={exportData.data}
            alt="Diagram"
            className="overflow-auto"
          />
        ) : (
          <Spin size="large" />
        )}
      </div>
    </ExportModal>
  );
}
