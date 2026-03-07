export type Styles = {
    headerCell: string;
    footerCell: string;
    rowNumber: string;
    selected: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
