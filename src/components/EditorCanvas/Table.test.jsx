import { fireEvent, render, screen } from "@testing-library/react";
import Table from "./Table";

const deleteFieldMock = vi.fn();

vi.mock("../../hooks", () => ({
  useLayout: () => ({ layout: { sidebar: true, readOnly: false } }),
  useSettings: () => ({
    settings: {
      mode: "light",
      tableWidth: 220,
      showComments: true,
      showFieldSummary: false,
      showDataTypes: true,
    },
  }),
  useDiagram: () => ({
    database: "generic",
    deleteTable: vi.fn(),
    deleteField: deleteFieldMock,
    updateTable: vi.fn(),
  }),
  useSelect: () => ({
    selectedElement: { id: -1, element: 0, currentTab: "1" },
    setSelectedElement: vi.fn(),
    bulkSelectedElements: [],
    setBulkSelectedElements: vi.fn(),
  }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

vi.mock("@douyinfe/semi-ui", () => ({
  Popover: ({ children, content }) => (
    <div>
      {children}
      {content}
    </div>
  ),
  Tag: ({ children }) => <span>{children}</span>,
  Button: ({ children, onClick, disabled, ...rest }) => {
    const { block, ...domProps } = rest;
    void block;
    return (
      <button onClick={onClick} disabled={disabled} {...domProps}>
        {children}
      </button>
    );
  },
  SideSheet: () => null,
}));

vi.mock("@douyinfe/semi-icons", () => ({
  IconEdit: () => <span />,
  IconMore: () => <span />,
  IconMinus: () => <span />,
  IconDeleteStroked: () => <span />,
  IconKeyStroked: () => <span />,
  IconLock: () => <span />,
  IconUnlock: () => <span />,
}));

const baseProps = {
  onPointerDown: vi.fn(),
  setHoveredTable: vi.fn(),
  handleGripField: vi.fn(),
  setLinkingLine: vi.fn(),
};

const tableData = {
  id: "table-1",
  name: "users",
  x: 0,
  y: 0,
  hidden: false,
  locked: false,
  color: "#175e7a",
  comment: "",
  indices: [],
  fields: [
    { id: "f1", name: "id", type: "INT", size: "" },
    { id: "f2", name: "age", type: "INT", size: "" },
  ],
};

describe("Table bulk field deletion action", () => {
  beforeEach(() => {
    deleteFieldMock.mockClear();
  });

  it("deletes all fields from the table when action is clicked", () => {
    render(<Table tableData={tableData} {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete all fields" }));

    expect(deleteFieldMock).toHaveBeenCalledTimes(2);
    expect(deleteFieldMock).toHaveBeenNthCalledWith(1, tableData.fields[0], "table-1");
    expect(deleteFieldMock).toHaveBeenNthCalledWith(2, tableData.fields[1], "table-1");
  });

  it("disables delete-all action when table has no fields", () => {
    render(
      <Table
        tableData={{
          ...tableData,
          fields: [],
        }}
        {...baseProps}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Delete all fields" }),
    ).toBeDisabled();
  });
});
