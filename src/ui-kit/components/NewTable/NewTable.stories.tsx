// import type { Meta, StoryObj } from "@storybook/react";
// import { DataTable } from "./NewTable";

// const meta = {
//   title: "UI-Kit/DataTable",
//   component: DataTable,
//   parameters: { layout: "centered" },
// } satisfies Meta<typeof DataTable>;

// export default meta;

// const columns = [
//   { id: "side", accessorKey: "side", header: "Side" },
//   { accessorKey: "code", header: "Code" },
//   {
//     accessorKey: "weight",
//     header: "Weight (kg)",
//     cell: (info: any) => info.getValue().toFixed(3),
//   },
//   { accessorKey: "pt", header: "Pt (g)" },
//   { accessorKey: "pd", header: "Pd (g)" },
//   { accessorKey: "rh", header: "Rh (g)" },
// ];

// const frontData = [
//   {
//     id: "1",
//     side: "1",
//     code: "F_L",
//     weight: 1.25,
//     pt: 2.35,
//     pd: 1.45,
//     rh: 0.35,
//   },
//   { id: "2", side: "2", code: "F_R", weight: 1.3, pt: 2.4, pd: 1.5, rh: 0.36 },
// ];

// export const ComparisonView: StoryObj = {
//   render: () => (
//     <div
//       style={{
//         display: "flex",
//         gap: "40px",
//         padding: "40px",
//         backgroundColor: "#f8fafc",
//         minWidth: "1000px",
//       }}
//     >
//       <div style={{ flex: 1 }}>
//         <h4 style={{ color: "#38a169", marginBottom: "8px" }}>
//           Front Catalytic Converter
//         </h4>
//         <DataTable variant="front" columns={columns} data={frontData} />
//       </div>
//       <div style={{ flex: 1 }}>
//         <h4 style={{ color: "#3182ce", marginBottom: "8px" }}>
//           Rear Catalytic Converter
//         </h4>
//         <DataTable variant="rear" columns={columns} data={frontData} />
//       </div>
//     </div>
//   ),
// };
