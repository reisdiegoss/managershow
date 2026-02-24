export interface Artist {
    id: string;
    name: string;
    genre?: string;
    status: 'ACTIVE' | 'INACTIVE';
    email?: string;
    phone?: string;
}

export interface Contractor {
    id: string;
    name: string;
    document: string; // CPF ou CNPJ
    email: string;
    phone: string;
    address?: string;
    city: string;
    state: string;
}

export interface Venue {
    id: string;
    name: string;
    capacity: number;
    city: string;
    state: string;
    address: string;
}
