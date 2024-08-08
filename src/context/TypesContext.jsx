import React, { createContext, useState, useContext, ReactNode } from 'react';
import PropTypes from 'prop-types';
import { Action, ObjectType } from '../data/constants';
import { useUndoRedo } from '../hooks';
import { Toast } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

// Define context
export const TypesContext = createContext(null);

// Custom hook for using the context
export const useTypesContext = () => {
  const context = useContext(TypesContext);
  if (!context) {
    throw new Error('useTypesContext must be used within a TypesContextProvider');
  }
  return context;
};

// TypesContextProvider component
const TypesContextProvider = ({ children }) => {
  const { t } = useTranslation();
  const [types, setTypes] = useState([]);
  const { setUndoStack, setRedoStack } = useUndoRedo();

  // Function to add a type
  const addType = (data, addToHistory = true) => {
    setTypes(prev => {
      const updatedTypes = data
        ? [...prev.slice(0, data.id), data, ...prev.slice(data.id)]
        : [...prev, { name: `type_${prev.length}`, fields: [], comment: '' }];
      
      if (addToHistory) {
        setUndoStack(prevUndoStack => [
          ...prevUndoStack,
          {
            action: Action.ADD,
            element: ObjectType.TYPE,
            message: t('add_type'),
          },
        ]);
        setRedoStack([]);
      }

      return updatedTypes;
    });
  };

  // Function to delete a type
  const deleteType = (id, addToHistory = true) => {
    if (id < 0 || id >= types.length) return; // Handle invalid ID

    if (addToHistory) {
      Toast.success(t('type_deleted'));
      setUndoStack(prevUndoStack => [
        ...prevUndoStack,
        {
          action: Action.DELETE,
          element: ObjectType.TYPE,
          id,
          data: types[id],
          message: t('delete_type', { typeName: types[id].name }),
        },
      ]);
      setRedoStack([]);
    }

    setTypes(prev => prev.filter((_, index) => index !== id));
  };

  // Function to update a type
  const updateType = (id, values) => {
    setTypes(prev =>
      prev.map((type, index) => (index === id ? { ...type, ...values } : type))
    );
  };

  return (
    <TypesContext.Provider value={{ types, addType, updateType, deleteType }}>
      {children}
    </TypesContext.Provider>
  );
};

// PropTypes for type checking in JavaScript
TypesContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default TypesContextProvider;
