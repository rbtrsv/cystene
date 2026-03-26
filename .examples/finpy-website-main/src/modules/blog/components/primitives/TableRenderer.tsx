"use client";

import React from 'react';

interface TableBlock {
  type: string;
  value: {
    cell: any[];
    data: string[][];
    mergeCells: any[];
    table_caption: string;
    first_col_is_header: boolean;
    table_header_choice: string;
    first_row_is_table_header: boolean;
  };
}

const TableRenderer: React.FC<{ block: TableBlock }> = ({ block }) => {
  const { data, table_caption } = block.value;

  return (
    <table className="table-auto">
      {table_caption && <caption>{table_caption}</caption>}
      <thead>
        <tr>
          {data[0].map((header, index) => (
            <th key={index}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.slice(1).map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TableRenderer;