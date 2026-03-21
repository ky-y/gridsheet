import { useState } from "react";
import { type ExtRow, GridSheet, getCellValue, toPlainData } from "../index.js";
import { columns, initialData } from "./sampleData.js";

export function App() {
    const [data, setData] = useState(initialData);

    const handleChange = (newData: ExtRow<typeof columns>[]) => {
        toPlainData(newData, columns);
        newData.map((row) => getCellValue(row.active));
        setData(newData);
    };

    return (
        <div>
            <h1>gridsheet playground</h1>
            <GridSheet
                columns={columns}
                data={data}
                onChange={handleChange}
                configs={{
                    showRowNumbers: true,
                    selectableHeaders: true,
                    selectableRowNumbers: true,
                    selectableTitles: true,
                }}
            />
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}
