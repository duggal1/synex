interface Metric {
    number: number;
    suffix?: string;
    label: string;
    image: string;
    reverse: boolean;
}

export const METRICS: Metric[] = [
    {
        number: 500_000,
        label: "Invoices processed",
        image: "/icons/metric-one.svg",
        reverse: false
    },
    {
        number: 250,
        suffix: "M+",
        label: "Total invoice value automated",
        image: "/icons/metric-two.svg",
        reverse: true
    },
    {
        number: 99,
        suffix: "%",
        label: "Accuracy in invoice extraction",
        image: "/icons/metric-three.svg",
        reverse: false
    }
];