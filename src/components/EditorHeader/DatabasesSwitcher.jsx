import { Select } from "@douyinfe/semi-ui";
import { databases } from "../../data/databases";
import { DB, State } from "../../data/constants";
import { useDiagram, useSaveState } from "../../hooks";
import { db } from "../../data/db";

const databasesWithoutGeneric = Object.keys(databases).filter(db => databases[db].label !== DB.GENERIC);

export default function DatabasesSwitcher({ setLastSaved, diagramId }) {
    const { database, setDatabase } = useDiagram();
    const { setSaveState } = useSaveState();

    if (!databases[database] || database === DB.GENERIC) return null;

    const renderOptionItem = renderProps => {
        const {
            disabled,
            selected,
            label,
            value,
            focused,
            className,
            style,
            onMouseEnter,
            onClick,
        } = renderProps;
        const optionCls = [
            'flex justify-start items-center pl-2 pt-3 cursor-pointer custom-option-render',
            focused && 'custom-option-render-focused',
            disabled && 'custom-option-render-disabled',
            selected && 'custom-option-render-selected',
            className,
        ].filter(cls => cls).join(' ');

        return (
            <div style={style} className={optionCls} onClick={() => onClick()} onMouseEnter={() => onMouseEnter()}>
                {databases[value].image && (
                    <img
                      src={databases[value].image}
                      className="h-5 pr-2"
                      style={{
                        filter:
                          "opacity(0.4) drop-shadow(0 0 0 white) drop-shadow(0 0 0 white)",
                      }}
                      alt={databases[value].name + " icon"}
                      title={databases[value].name + " diagram"}
                    />
                )}
                <div className="option-right pr-2">{label}</div>
            </div>
        );
    };
    const onChangeHandler = async (selectedDb) => {
        await db.diagrams
            .update(diagramId, {
                database: selectedDb,
            }).then(() => {
                setSaveState(State.SAVED);
                setLastSaved(new Date().toLocaleString());
                setDatabase(selectedDb);
            });
    };

    return <Select
        className="w-100"
        optionList={databasesWithoutGeneric.map((db) => ({
            label: databases[db].name,
            value: databases[db].label,
        }))}
        filter
        value={database}
        placeholder="Select database"
        onChange={onChangeHandler}
        renderOptionItem={renderOptionItem}
    />
}