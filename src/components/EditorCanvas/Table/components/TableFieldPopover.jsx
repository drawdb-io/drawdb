import React from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../../../i18n/i18n";
import { isRtl } from "../../../../i18n/utils/rtl";
import { Popover, Tag } from "@douyinfe/semi-ui";
import { dbToTypes } from "../../../../data/datatypes";
import { useDiagram } from "../../../../hooks";

export default function TableFieldPopover({ fieldData, children, visible }) {
  const { database } = useDiagram();
  const { t } = useTranslation();

  if (!visible) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  const FieldSize = React.memo(({ field }) => {
    let hasSize =
      dbToTypes[database][field.type].isSized ||
      dbToTypes[database][field.type].hasPrecision;
    let sizeValid = field.size && field.size !== "";

    if (hasSize && sizeValid) {
      return `(${field.size})`;
    } else {
      return "";
    }
  });

  FieldSize.displayName = "FieldSize";

  return (
    <Popover
      content={
        <div className="popover-theme">
          <div
            className="flex justify-between items-center pb-2"
            style={{ direction: "ltr" }}
          >
            <p className="me-4 font-bold">{fieldData.name}</p>
            <p className="ms-4">{<FieldSize field={fieldData} />}</p>
          </div>

          <hr />

          {fieldData.primary && (
            <Tag color="blue" className="me-2 my-2">
              {t("primary")}
            </Tag>
          )}
          {fieldData.unique && (
            <Tag color="amber" className="me-2 my-2">
              {t("unique")}
            </Tag>
          )}
          {fieldData.notNull && (
            <Tag color="purple" className="me-2 my-2">
              {t("not_null")}
            </Tag>
          )}
          {fieldData.increment && (
            <Tag color="green" className="me-2 my-2">
              {t("autoincrement")}
            </Tag>
          )}
          <p>
            <strong>{t("default_value")}: </strong>
            {fieldData.default === "" ? t("not_set") : fieldData.default}
          </p>
          <p>
            <strong>{t("comment")}: </strong>
            {fieldData.comment === "" ? t("not_set") : fieldData.comment}
          </p>
        </div>
      }
      position="right"
      showArrow
      style={isRtl(i18n.language) ? { direction: "rtl" } : { direction: "ltr" }}
    >
      {children}
    </Popover>
  );
}
