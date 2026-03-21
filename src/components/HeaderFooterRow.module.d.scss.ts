export type Styles = {
    footerCell: string;
    headerCell: string;
    rowNumber: string;
    selected: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
