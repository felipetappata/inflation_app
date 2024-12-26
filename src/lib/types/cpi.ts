export interface CPIDataPoint {
    date: Date;
    value: number;
}

export interface CountryData {
    id: string;
    name: string;
    data: CPIDataPoint[];
}
