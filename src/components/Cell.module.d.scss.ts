export type Styles = {
    cell: string;
    editing: string;
    numericCell: string;
    selected: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
