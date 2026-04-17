
import { APIRequestContext, APIResponse } from '@playwright/test';

export class MythologyApiClient {
    private readonly baseUrl = 'mythology';

    constructor(
        private request: APIRequestContext,
        private authToken?: string
    ) { }

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        return headers;
    }

    async create(payload: unknown): Promise<APIResponse> {
        return this.request.post(this.baseUrl, {
            data: payload,
            headers: this.getHeaders(),
        });
    }

    async update(id: number, payload: unknown): Promise<APIResponse> {
        return this.request.put(`${this.baseUrl}/${id}`, {
            data: payload,
            headers: this.getHeaders(),
        });
    }

    async patch(id: number, payload: unknown): Promise<APIResponse> {
        return this.request.patch(`${this.baseUrl}/${id}`, {
            data: payload,
            headers: this.getHeaders(),
        });
    }

    async delete(id: number): Promise<APIResponse> {
        return this.request.delete(`${this.baseUrl}/${id}`, {
            headers: this.getHeaders(),
        });
    }

    async postToItem(id: number, payload: unknown): Promise<APIResponse> {
        return this.request.post(`${this.baseUrl}/${id}`, {
            data: payload,
            headers: this.getHeaders(),
        });
    }
}



