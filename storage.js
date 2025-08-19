import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const STORAGE_FILE = join(process.cwd(), 'api_keys.json')

class ApiKeyStorage {
    constructor() {
        this.data = {}
        this.loaded = false
    }

    async load() {
        if (this.loaded) return this.data

        try {
            if (existsSync(STORAGE_FILE)) {
                const content = await readFile(STORAGE_FILE, 'utf8')
                this.data = JSON.parse(content)
            } else {
                this.data = {}
            }
            this.loaded = true
        } catch (error) {
            this.data = {}
            this.loaded = true
        }

        return this.data
    }

    async save() {
        try {
            await writeFile(STORAGE_FILE, JSON.stringify(this.data, null, 2), 'utf8')
        } catch (error) {
            throw error
        }
    }

    async setApiKey(accountId, apiKey, retailcrmApiKey = null) {
        await this.load()
        this.data[accountId] = {
            apiKey,
            retailcrmApiKey,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
        await this.save()
    }

    async getApiKey(accountId) {
        await this.load()
        return this.data[accountId]?.apiKey || null
    }

    async getRetailcrmApiKey(accountId) {
        await this.load()
        return this.data[accountId]?.retailcrmApiKey || null
    }

    async deleteApiKey(accountId) {
        await this.load()
        if (this.data[accountId]) {
            delete this.data[accountId]
            await this.save()
            return true
        }
        return false
    }

    async getAllKeys() {
        await this.load()
        return this.data
    }
}

export const apiKeyStorage = new ApiKeyStorage() 