import {
  tableColorStripHeight,
  tableFieldHeight,
  tableHeaderHeight,
} from "./constants";

const xOffset = window.innerWidth * 0.65;
export const diagram = {
  tables: [
    {
      name: "galactic_users",
      x: xOffset + 75,
      y:
        window.innerHeight * 0.23 -
        (tableHeaderHeight + 4 * tableFieldHeight + tableColorStripHeight) *
          0.5,
      fields: [
        {
          name: "id",
          type: "INT",
        },
        {
          name: "username",
          type: "VARCHAR",
        },
        {
          name: "email",
          type: "VARCHAR",
        },
        {
          name: "password",
          type: "VARCHAR",
        },
      ],
      color: "#7d9dff",
    },
    {
      id: 1,
      name: "celestial_data",
      x: xOffset + 27,
      y:
        window.innerHeight * 0.72 -
        (tableHeaderHeight + 5 * tableFieldHeight + tableColorStripHeight) *
          0.5,
      fields: [
        {
          name: "id",
          type: "INT",
        },
        {
          name: "user_id",
          type: "INT",
        },
        {
          name: "type",
          type: "ENUM",
        },
        {
          name: "time",
          type: "TIMESTAMP",
        },
        {
          name: "content",
          type: "VARCHAR",
        },
      ],
      color: "#89e667",
    },
    {
      id: 2,
      name: "astro_mine",
      x: xOffset + 336,
      y:
        window.innerHeight * 0.72 -
        (tableHeaderHeight + 3 * tableFieldHeight + tableColorStripHeight) *
          0.5,
      fields: [
        {
          name: "id",
          type: "INT",
        },
        {
          name: "asteroid_id",
          type: "INT",
        },
        {
          name: "data_id",
          type: "INT",
        },
      ],
      color: "#6360f7",
    },
    {
      id: 3,
      name: "asteroid",
      x: xOffset + 310,
      y:
        window.innerHeight * 0.23 -
        (tableHeaderHeight + 3 * tableFieldHeight + tableColorStripHeight) *
          0.5,
      fields: [
        {
          name: "id",
          type: "INT",
        },
        {
          name: "name",
          type: "VARCHAR",
        },
        {
          name: "location",
          type: "VARCHAR",
        },
      ],
      color: "#3cde7d",
    },
  ],
  relationships: [
    {
      startTableId: 1,
      startFieldId: 1,
      endTableId: 0,
      endFieldId: 0,
      cardinality: "many_to_one",
    },
    {
      startTableId: 2,
      startFieldId: 2,
      endTableId: 1,
      endFieldId: 0,
      cardinality: "one_to_one",
    },
    {
      startTableId: 2,
      startFieldId: 1,
      endTableId: 3,
      endFieldId: 0,
      cardinality: "many_to_one",
    },
  ],
};
