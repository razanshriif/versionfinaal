export interface User {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    password?: string;
    role: 'CLIENT' | 'COMMERCIAL' | 'ADMIN' | 'USER_Otflow';
    status: 'PENDING' | 'ACTIVE' | 'REJECTED';
}



