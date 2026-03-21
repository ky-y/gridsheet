export type Styles = {
    GridSheet: string;
    rowNumber: string;
    selectAll: string;
    selected: string;
    titleCell: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
