export interface Document {
    id: number;
    name: string;
    status: string;
    status_text: string;
    sms: string | null;
    date_create: string;
    contacts: Contact[];
    contact: Contact;
    send_email: string;
    sign_at: string | null;
    packageData: PackageData;
    [key: string]: any;
}

export interface Contact {
    name: string;
    last_name: string;
    second_name: string | null;
    surname: string | null;
    phone: string;
    email: string | null;
    sid: string;
    link: string;
}

export interface PackageData {
    id: number;
    code: string;
    status: string | null;
    files_strict: number;
    auth: string | null;
    sign_by_time: string | null;
    send_date: string | null;
} 