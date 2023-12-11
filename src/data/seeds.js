const t1 = {
  tables: [
    {
      id: 0,
      name: "table_0",
      x: 73,
      y: 69,
      fields: [
        {
          name: "id",
          type: "INT",
          default: "",
          check: "",
          primary: true,
          unique: true,
          notNull: true,
          increment: true,
          comment: "",
          id: 0,
        },
      ],
      comment: "",
      indices: [],
      color: "#175e7a",
    },
    {
      id: 1,
      name: "table_1",
      x: 366,
      y: 117,
      fields: [
        {
          name: "id",
          type: "INT",
          default: "",
          check: "",
          primary: true,
          unique: true,
          notNull: true,
          increment: true,
          comment: "",
          id: 0,
        },
      ],
      comment: "",
      indices: [],
      color: "#175e7a",
    },
  ],
  relationships: [
    {
      startTableId: 0,
      startFieldId: 0,
      endTableId: 1,
      endFieldId: 0,
      startX: 88,
      startY: 138,
      endX: 381,
      endY: 186,
      name: "table_0_id_fk",
      cardinality: "One to one",
      updateConstraint: "No action",
      deleteConstraint: "No action",
      mandatory: false,
      id: 0,
    },
  ],
  notes: [
    {
      id: 0,
      x: 526,
      y: 240,
      title: "note_0",
      content: "hi",
      color: "#fcf7ac",
      height: 65,
    },
  ],
  subjectAreas: [
    {
      id: 0,
      name: "area_0",
      x: 43,
      y: 28,
      width: 558,
      height: 206,
      color: "#175e7a",
    },
  ],
  types: [],
  title: "Template 1",
  description: "Lorem ipsum",
};

const t2 = {
  tables: [
    {
      id: 0,
      name: "template_2",
      x: 57,
      y: 63,
      fields: [
        {
          name: "id",
          type: "INT",
          default: "",
          check: "",
          primary: true,
          unique: true,
          notNull: true,
          increment: true,
          comment: "",
          id: 0,
        },
      ],
      comment: "",
      indices: [],
      color: "#ff4f81",
    },
  ],
  relationships: [],
  notes: [],
  subjectAreas: [],
  types: [],
  title: "Template 2",
  description: "Lorem ipsum",
};

const t3 = {
  tables: [
    {
      id: 0,
      name: "template_3",
      x: 57,
      y: 63,
      fields: [
        {
          name: "id",
          type: "INT",
          default: "",
          check: "",
          primary: true,
          unique: true,
          notNull: true,
          increment: true,
          comment: "",
          id: 0,
        },
      ],
      comment: "",
      indices: [],
      color: "#bc49c4",
    },
  ],
  relationships: [],
  notes: [],
  subjectAreas: [],
  types: [],
  title: "Template 3",
  description: "Lorem ipsum",
};

const t4 = {
  tables: [
    {
      id: 0,
      name: "template_4",
      x: 57,
      y: 63,
      fields: [
        {
          name: "id",
          type: "INT",
          default: "",
          check: "",
          primary: true,
          unique: true,
          notNull: true,
          increment: true,
          comment: "",
          id: 0,
        },
      ],
      comment: "",
      indices: [],
      color: "#a751e8",
    },
  ],
  relationships: [],
  notes: [],
  subjectAreas: [],
  types: [],
  title: "Template 4",
  description: "Lorem ipsum",
};

const t5 = {
  tables: [
    {
      id: 0,
      name: "template_5",
      x: 57,
      y: 63,
      fields: [
        {
          name: "id",
          type: "INT",
          default: "",
          check: "",
          primary: true,
          unique: true,
          notNull: true,
          increment: true,
          comment: "",
          id: 0,
        },
      ],
      comment: "",
      indices: [],
      color: "#7c4af0",
    },
  ],
  relationships: [],
  notes: [],
  subjectAreas: [],
  types: [],
  title: "Template 5",
  description: "Lorem ipsum",
};

const t6 = {
  tables: [
    {
      id: 0,
      name: "template_6",
      x: 57,
      y: 63,
      fields: [
        {
          name: "id",
          type: "INT",
          default: "",
          check: "",
          primary: true,
          unique: true,
          notNull: true,
          increment: true,
          comment: "",
          id: 0,
        },
      ],
      comment: "",
      indices: [],
      color: "#6360f7",
    },
  ],
  relationships: [],
  notes: [],
  subjectAreas: [],
  types: [],
  title: "Template 6",
  description: "Lorem ipsum",
};

const t7 = {
  tables: [
    {
      id: 0,
      name: "template_7",
      x: 57,
      y: 63,
      fields: [
        {
          name: "id",
          type: "INT",
          default: "",
          check: "",
          primary: true,
          unique: true,
          notNull: true,
          increment: true,
          comment: "",
          id: 0,
        },
      ],
      comment: "",
      indices: [],
      color: "#7d9dff",
    },
  ],
  relationships: [],
  notes: [],
  subjectAreas: [],
  types: [],
  title: "Template 7",
  description: "Lorem ipsum",
};

const t8 = {
  tables: [
    {
      id: 0,
      name: "template_8",
      x: 57,
      y: 63,
      fields: [
        {
          name: "id",
          type: "INT",
          default: "",
          check: "",
          primary: true,
          unique: true,
          notNull: true,
          increment: true,
          comment: "",
          id: 0,
        },
      ],
      comment: "",
      indices: [],
      color: "#32c9b0",
    },
  ],
  relationships: [],
  notes: [],
  subjectAreas: [],
  types: [],
  title: "Template 8",
  description: "Lorem ipsum",
};

const templateSeeds = [t1, t2, t3, t4, t5, t6, t7, t8];

export { templateSeeds };
