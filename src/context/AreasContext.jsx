import React, { createContext, useState, ReactNode, useContext } from 'react';
import PropTypes from 'prop-types';
import { Action, ObjectType, defaultBlue } from '../data/constants';
import { useUndoRedo, useTransform, useSelect } from '../hooks';
import { Toast } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

// Define context
export const AreasContext = createContext(null); // Ensure export is here

export const useAreasContext = () => {
  const context = useContext(AreasContext);
  if (!context) {
    throw new Error('useAreasContext must be used within an AreasContextProvider');
  }
  return context;
};

// AreasContextProvider component
const AreasContextProvider = ({ children }) => {
  const { t } = useTranslation();
  const [areas, setAreas] = useState([]);
  const { transform } = useTransform();
  const { selectedElement, setSelectedElement } = useSelect();
  const { setUndoStack, setRedoStack } = useUndoRedo();

  const addArea = (data, addToHistory = true) => {
    if (data) {
      addExistingArea(data);
    } else {
      addNewArea();
    }
    if (addToHistory) {
      addActionToHistory(Action.ADD, ObjectType.AREA, t("add_area"));
    }
  };

  const addExistingArea = (data) => {
    setAreas(prev => {
      const updatedAreas = [...prev];
      updatedAreas.splice(data.id, 0, data);
      return updatedAreas.map((area, i) => ({ ...area, id: i }));
    });
  };

  const addNewArea = () => {
    const width = 200;
    const height = 200;
    setAreas(prev => [
      ...prev,
      {
        id: prev.length,
        name: `area_${prev.length}`,
        x: transform.pan.x - width / 2,
        y: transform.pan.y - height / 2,
        width,
        height,
        color: defaultBlue,
      },
    ]);
  };

  const deleteArea = (id, addToHistory = true) => {
    if (id < 0 || id >= areas.length) return; // Handle invalid ID
    if (addToHistory) {
      Toast.success(t("area_deleted"));
      addActionToHistory(Action.DELETE, ObjectType.AREA, t("delete_area", areas[id].name), areas[id]);
    }
    setAreas(prev => {
      const filteredAreas = prev.filter(e => e.id !== id);
      return filteredAreas.map((e, i) => ({ ...e, id: i }));
    });
    if (id === selectedElement.id) {
      clearSelectedElement();
    }
  };

  const clearSelectedElement = () => {
    setSelectedElement({
      element: ObjectType.NONE,
      id: -1,
      open: false,
    });
  };

  const updateArea = (id, values) => {
    setAreas(prev => prev.map(area => area.id === id ? { ...area, ...values } : area));
  };

  const addActionToHistory = (action, element, message, data) => {
    setUndoStack(prev => [
      ...prev,
      { action, element, message, data },
    ]);
    setRedoStack([]);
  };

  return (
    <AreasContext.Provider value={{ areas, setAreas, updateArea, addArea, deleteArea }}>
      {children}
    </AreasContext.Provider>
  );
};

AreasContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AreasContextProvider;
