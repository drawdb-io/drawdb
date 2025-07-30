import { Form, Card, Row, Col, InputNumber } from "@douyinfe/semi-ui";
import { useSettings, useDiagram } from "../../../hooks";
import { useTranslation } from "react-i18next";
import { dbToTypes } from "../../../data/datatypes";

export default function DefaultTypeSizes() {
  const { settings, setSettings } = useSettings();
  const { database } = useDiagram();
  const { t } = useTranslation();

  // Ensure settings are loaded before rendering
  if (!settings || !settings.defaultTypeSizes || !database) {
    return (
      <div className="text-center text-gray-500 py-8">
        <div className="text-lg mb-2">⏳</div>
        <div>Loading...</div>
      </div>
    );
  }

  const handleSizeChange = (typeName, value) => {
    setSettings(prev => ({
      ...prev,
      defaultTypeSizes: {
        ...(prev?.defaultTypeSizes || {}),
        [database]: {
          ...(prev?.defaultTypeSizes?.[database] || {}),
          [typeName]: value || 1
        }
      }
    }));
  };

  const handlePrecisionChange = (typeName, field, value) => {
    const currentDbSettings = settings?.defaultTypeSizes?.[database] || {};
    const currentValue = currentDbSettings[typeName] || {};
    const newValue = typeof currentValue === 'object' ? currentValue : {};

    setSettings(prev => ({
      ...prev,
      defaultTypeSizes: {
        ...(prev?.defaultTypeSizes || {}),
        [database]: {
          ...(prev?.defaultTypeSizes?.[database] || {}),
          [typeName]: {
            ...newValue,
            [field]: value || (field === 'precision' ? 10 : 0)
          }
        }
      }
    }));
  };

  const getCurrentTypes = () => {
    return dbToTypes[database] || {};
  };

  const getSizedTypes = () => {
    const types = getCurrentTypes();
    return Object.keys(types).filter(typeName =>
      types[typeName].isSized
    ).sort();
  };

  const getPrecisionTypes = () => {
    const types = getCurrentTypes();
    return Object.keys(types).filter(typeName =>
      types[typeName].hasPrecision
    ).sort();
  };

  const getDefaultSize = (typeName) => {
    const types = getCurrentTypes();
    // Ensure settings.defaultTypeSizes exists and has the correct structure
    const dbSettings = settings?.defaultTypeSizes?.[database] || {};
    const userSize = dbSettings[typeName];
    // If the user has set a specific size for this DB
    if (typeof userSize === 'number') {
      return userSize;
    }
    // If not, use the default size for the type
    return types[typeName]?.defaultSize || 1;
  };

  const getDefaultPrecision = (typeName) => {
    const dbSettings = settings?.defaultTypeSizes?.[database] || {};
    const userSettings = dbSettings[typeName];
    if (typeof userSettings === 'object' && userSettings?.precision !== undefined) {
      return userSettings.precision;
    }
    return 10;
  };

  const getDefaultScale = (typeName) => {
    const dbSettings = settings?.defaultTypeSizes?.[database] || {};
    const userSettings = dbSettings[typeName];
    if (typeof userSettings === 'object' && userSettings?.scale !== undefined) {
      return userSettings.scale;
    }
    return 2;
  };

  const sizedTypes = getSizedTypes();
  const precisionTypes = getPrecisionTypes();

  return (
    <div className="space-y-6 max-h-96 overflow-y-auto">
      {sizedTypes.length > 0 && (
        <Card
          title={`${t("default_size")} (${database.toUpperCase()})`}
          className="w-full"
          bodyStyle={{ padding: '16px' }}
        >
          <Row gutter={[16, 16]}>
            {sizedTypes.map(typeName => (
              <Col span={12} key={`sized-${typeName}`}>
                <Form.Section text={typeName}>
                  <InputNumber
                    value={getDefaultSize(typeName)}
                    onChange={(value) => handleSizeChange(typeName, value)}
                    min={1}
                    max={999999}
                    placeholder={t("default_size")}
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`}
                    parser={(value) => value?.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Section>
              </Col>
            ))}
          </Row>
        </Card>
      )}
      {precisionTypes.length > 0 && (
        <Card
          title={`${t("default_precision")} (${database.toUpperCase()})`}
          className="w-full"
          bodyStyle={{ padding: '16px' }}
        >
          <div className="space-y-4">
            {precisionTypes.map(typeName => (
              <div key={`precision-${typeName}`} className="border-b pb-4 last:border-b-0">
                <div className="mb-3 font-medium text-gray-700">{typeName}</div>
                <Row gutter={16}>
                  <Col span={12}>
                    <div className="mb-2 text-sm text-gray-600">{t("precision")}</div>
                    <InputNumber
                      value={getDefaultPrecision(typeName)}
                      onChange={(value) => handlePrecisionChange(typeName, 'precision', value)}
                      min={1}
                      max={65}
                      placeholder={t("precision")}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={12}>
                    <div className="mb-2 text-sm text-gray-600">{t("default_scale")}</div>
                    <InputNumber
                      value={getDefaultScale(typeName)}
                      onChange={(value) => handlePrecisionChange(typeName, 'scale', value)}
                      min={0}
                      max={30}
                      placeholder={t("default_scale")}
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>
              </div>
            ))}
          </div>
        </Card>
      )}

      {sizedTypes.length === 0 && precisionTypes.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <div className="text-lg mb-2">📝</div>
          <div>{t("no_configurable_types")}</div>
          <div className="text-sm mt-2">
            {database.toUpperCase()} {t("database")}
          </div>
        </div>
      )}
    </div>
  );
}
