export type FAQItem = {
    question: string;
    answer: string;
};

export const FAQS: FAQItem[] = [
    {
        question: "How does Synex AI automate invoice processing?",
        answer: "Synex AI extracts key data from invoices using advanced AI models, categorizes transactions, and syncs with your accounting software—eliminating manual entry and reducing errors."
    },
    {
        question: "What types of invoices does Synex AI support?",
        answer: "Synex AI supports invoices in PDF, scanned images, and digital formats. It handles multi-currency, multi-language, and varying invoice structures with high accuracy."
    },
    {
        question: "How accurate is the AI in extracting invoice data?",
        answer: "Synex AI achieves over 99% accuracy in extracting invoice details, thanks to its advanced training on vast datasets and continuous learning improvements."
    },
    {
        question: "Can Synex AI integrate with my accounting software?",
        answer: "Yes, Synex AI integrates with QuickBooks, Xero, Zoho Books, and other accounting tools. You can also use API access for custom integrations."
    },
    {
        question: "Is my financial data secure with Synex AI?",
        answer: "Absolutely. Synex AI uses bank-grade encryption, secure cloud storage, and strict access controls to protect your financial data from unauthorized access."
    },
    {
        question: "Do I need technical skills to use Synex AI?",
        answer: "Not at all. Synex AI is designed for ease of use. Simply upload invoices, and our AI takes care of the rest—no coding or setup required."
    }
];