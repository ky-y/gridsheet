export type Styles = {
    dividerBottom: string;
    dividerRight: string;
    dividerTop: string;
    headerCell: string;
    index: string;
    selectAll: string;
    selected: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
