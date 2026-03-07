export type Styles = {
  'GridSheet': string;
  'titleCell': string;
  'rowNumber': string;
  'selectAll': string;
  'selected': string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
