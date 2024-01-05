const xOffset = window.innerWidth * 0.42 * 0.15;
export const diagram = {
  tables: [
    {
      name: "galactic_users",
      x: xOffset + 101,
      y: window.innerHeight * 0.75 - (4 * 36 + 50 + 7) * 0.5,
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
      name: "celestial_data",
      x: xOffset,
      y: window.innerHeight * 0.32 - (5 * 36 + 50 + 7) * 0.5,
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
  ],
  relationships: [
    {
      startTableId: 1,
      startFieldId: 1,
      endTableId: 0,
      endFieldId: 0,
      startX: xOffset + 16,
      startY:
        window.innerHeight * 0.32 - (4 * 36 + 50 + 7) * 0.5 + (50 + 18 * 2),
      endX: xOffset + 115,
      endY: window.innerHeight * 0.75 - (4 * 36 + 50 + 7) * 0.5 + (50 + 18 * 1),
      cardinality: "Many to one",
    },
  ],
};