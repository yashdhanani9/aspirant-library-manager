const API_URL = 'http://localhost:5000/api';

export const ApiService = {
    login: async (mobile, password) => {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile, password })
        });
        if (!res.ok) throw new Error('Login failed');
        return res.json();
    },

    getAllStudents: async () => {
        const res = await fetch(`${API_URL}/students`);
        return res.json();
    },

    addStudent: async (studentData) => {
        const res = await fetch(`${API_URL}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });
        if (!res.ok) throw new Error('Failed to add student');
        return res.json();
    },

    updateStudent: async (studentData) => {
        const res = await fetch(`${API_URL}/students/${studentData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });
        if (!res.ok) throw new Error('Failed to update student');
        return res.json();
    },

    getSeatsStatus: async () => {
        const res = await fetch(`${API_URL}/seats`);
        return res.json();
    },

    getWifiNetworks: async () => {
        const res = await fetch(`${API_URL}/wifi`);
        return res.json();
    },

    addWifiNetwork: async (ssid, password) => {
        await fetch(`${API_URL}/wifi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ssid, password })
        });
    },

    deleteWifiNetwork: async (id) => {
        await fetch(`${API_URL}/wifi/${id}`, { method: 'DELETE' });
    },

    getAnnouncement: async () => {
        const res = await fetch(`${API_URL}/announcement`);
        return res.json();
    },

    setAnnouncement: async (message, isActive) => {
        await fetch(`${API_URL}/announcement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, isActive })
        });
    },

    uploadFile: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) throw new Error('Upload Failed');
        return res.json();
    },

    getTransactions: async () => {
        const res = await fetch(`${API_URL}/transactions`);
        return res.json();
    }
};
