import React, { useState } from 'react';
import {
  Modal,
  Typography,
  Button,
  Card,
  Tag,
  Space,
  Divider,
  Collapse,
  List,
} from '@douyinfe/semi-ui';
import { IconKeyStroked, IconGridView, IconLink } from '@douyinfe/semi-icons';
import { responsibilityColors, responsibilityLabels } from '../../data/constants';

const { Title, Text, Paragraph } = Typography;

const PreviewModal = ({ 
  visible, 
  onCancel, 
  onApprove, 
  onReject, 
  onCreateInSupabase,
  isMcpConfigured = false,
  previewData,
  loading = false 
}) => {
  const [selectedTables, setSelectedTables] = useState(new Set());
  const [createLocation, setCreateLocation] = useState('canvas'); // 'canvas' or 'supabase' or 'both'

  const handleTableToggle = (tableId) => {
    const newSelected = new Set(selectedTables);
    if (newSelected.has(tableId)) {
      newSelected.delete(tableId);
    } else {
      newSelected.add(tableId);
    }
    setSelectedTables(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTables.size === previewData?.tables?.length) {
      setSelectedTables(new Set());
    } else {
      setSelectedTables(new Set(previewData?.tables?.map(t => t.id) || []));
    }
  };

  const handleApprove = () => {
    const selectedTablesList = previewData?.tables?.filter(t => selectedTables.has(t.id)) || [];
    const selectedRelationships = previewData?.relationships?.filter(r => {
      const startTable = selectedTablesList.find(t => t.name === r.startTableName);
      const endTable = selectedTablesList.find(t => t.name === r.endTableName);
      return startTable && endTable;
    }) || [];

    onApprove({
      tables: selectedTablesList,
      relationships: selectedRelationships,
    });
  };

  const renderField = (field) => (
    <div key={field.id} className="flex items-center justify-between p-2 bg-gray-50 rounded mb-1">
      <div className="flex items-center gap-2">
        {field.primary && <IconKeyStroked className="text-blue-500" size="small" />}
        <Text strong={field.primary}>{field.name}</Text>
        {field.responsibility && (
          <div
            className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white rounded-full"
            style={{ backgroundColor: responsibilityColors[field.responsibility] }}
            title={responsibilityLabels[field.responsibility]}
          >
            {field.responsibility}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Text type="tertiary" size="small">
          {field.type}
          {field.size ? `(${field.size})` : ''}
        </Text>
        {!field.notNull && <Text type="tertiary" size="small">NULL</Text>}
      </div>
    </div>
  );

  const renderTable = (table) => (
    <Card
      key={table.id}
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedTables.has(table.id)}
              onChange={() => handleTableToggle(table.id)}
              className="mr-2"
            />
            <IconGridView />
            <Text strong>{table.name}</Text>
          </div>
          <Tag color="blue">{table.fields?.length || 0} campos</Tag>
        </div>
      }
      className="mb-4"
      style={{
        opacity: selectedTables.has(table.id) ? 1 : 0.6,
        borderColor: selectedTables.has(table.id) ? '#3B82F6' : undefined,
      }}
    >
      <div className="space-y-1">
        {table.fields?.map(renderField) || <Text type="tertiary">Nenhum campo</Text>}
      </div>
    </Card>
  );

  const renderRelationships = () => {
    if (!previewData?.relationships?.length) return null;

    return (
      <div className="mt-6">
        <Title level={4}>
          <IconLink className="mr-2" />
          Relacionamentos ({previewData.relationships.length})
        </Title>
        <List
          dataSource={previewData.relationships}
          renderItem={(rel) => (
            <List.Item>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Text strong>{rel.startTableName}</Text>
                  <Text type="tertiary">({rel.startFieldName})</Text>
                  <Text type="secondary">→</Text>
                  <Text strong>{rel.endTableName}</Text>
                  <Text type="tertiary">({rel.endFieldName})</Text>
                </div>
                <Tag color="green">{rel.cardinality}</Tag>
              </div>
            </List.Item>
          )}
        />
      </div>
    );
  };

  if (!previewData) return null;

  return (
    <Modal
      title="Preview: Tabelas Geradas pela IA"
      visible={visible}
      onCancel={onCancel}
      width={800}
      style={{ maxWidth: '90vw' }}
      footer={
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              type="tertiary"
              onClick={handleSelectAll}
            >
              {selectedTables.size === previewData?.tables?.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
            </Button>
            <Text type="tertiary" size="small">
              {selectedTables.size} de {previewData?.tables?.length || 0} tabelas selecionadas
            </Text>
          </div>
          <Space>
            <Button onClick={onReject}>
              Rejeitar
            </Button>
            <Button
              type="secondary"
              onClick={handleApprove}
              disabled={selectedTables.size === 0 || loading}
              loading={loading && createLocation === 'canvas'}
            >
              Criar no Canvas
            </Button>
            {isMcpConfigured && (
              <Button
                type="primary"
                onClick={() => {
                  const selectedTablesList = previewData?.tables?.filter(t => selectedTables.has(t.id)) || [];
                  const selectedRelationships = previewData?.relationships?.filter(r => {
                    const startTable = selectedTablesList.find(t => t.name === r.startTableName);
                    const endTable = selectedTablesList.find(t => t.name === r.endTableName);
                    return startTable && endTable;
                  }) || [];
                  
                  onCreateInSupabase({
                    tables: selectedTablesList,
                    relationships: selectedRelationships,
                  });
                }}
                disabled={selectedTables.size === 0 || loading}
                loading={loading && createLocation === 'supabase'}
              >
                Criar no Supabase
              </Button>
            )}
          </Space>
        </div>
      }
    >
      <div className="max-h-[70vh] overflow-y-auto">
        <Paragraph type="tertiary">
          A IA gerou as seguintes tabelas baseadas na sua descrição. 
          Selecione quais tabelas deseja criar no seu diagrama:
        </Paragraph>
        
        <Divider />

        {previewData.tables?.map(renderTable)}

        {renderRelationships()}
      </div>
    </Modal>
  );
};

export default PreviewModal;