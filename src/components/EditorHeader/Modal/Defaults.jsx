import { Form, Tabs, TabPane } from "@douyinfe/semi-ui";
import { useSettings, useDiagram } from "../../../hooks";
import { useTranslation } from "react-i18next";
import { dbToTypes } from "../../../data/datatypes";
import DefaultTypeSizes from "./DefaultTypeSizes";

export default function Defaults() {
  const { settings, setSettings } = useSettings();
  const { database } = useDiagram();
  const { t } = useTranslation();

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev, [field]: value
      }
    ));
  };

  return (
    <Tabs defaultActiveKey="1" type="line">
      <TabPane tab={t("field_defaults")} itemKey="1">
        <Form initValues={{
           defaultFieldType: settings.defaultFieldType,
           upperCaseFields: settings.upperCaseFields,
           defaultNotNull: settings.defaultNotNull
         }}>
        <Form.Section text={t("field_defaults")}>
          <Form.Select
            field="defaultFieldType"
            label={t("default_field_type")}
            defaultValue={settings.defaultFieldType}
            onChange={(value) => handleChange('defaultFieldType', value)}
          >
            {Object.keys(dbToTypes[database]).map(type => (
              <Form.Select.Option key={type} value={type}>
                {type}
              </Form.Select.Option>
            ))}
          </Form.Select>

          <Form.Switch
            field="upperCaseFields"
            label={t("uppercase_fields")}
            defaultChecked={settings.upperCaseFields}
            onChange={(checked) => handleChange('upperCaseFields', checked)}
          />

          <Form.Switch
            field="defaultNotNull"
            label={t("default_not_null")}
            defaultChecked={settings.defaultNotNull}
            onChange={(checked) => handleChange('defaultNotNull', checked)}
          />
        </Form.Section>
      </Form>
      </TabPane>
      <TabPane tab={t("default_type_sizes")} itemKey="2">
        <DefaultTypeSizes />
      </TabPane>
    </Tabs>
  );
}
