import cors from 'cors'
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

import { config as configEnv } from 'dotenv'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { readFile } from 'node:fs'
import { apiKeyStorage } from './storage.js'

configEnv({ path: '.env' })

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()

const urlencoded = express.urlencoded({ extended: true })

const readManifest = (path) => {
    return new Promise((resolve) => {
        readFile(path, 'utf-8', (e, data) => {
            if (e) {
                resolve({})
            } else if (data) {
                resolve(JSON.parse(data))
            } else {
                resolve({})
            }
        })
    })
}

const renderEntrypoint = (name, manifest, entry) => {
    const scriptPath = `/dist/${name}/${manifest[entry].slice(2)}`;

    const html = `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>UI Extension: ${name}</title>
    <script type="module" src="${scriptPath}"></script>
</head>
<body></body>
</html>`;
    return html;
}

const renderSettingsPage = (name, manifest) => {
    const jsEntry = `${name}.js`
    const cssEntry = `${name}.css`
    
    const jsPath = manifest[jsEntry] ? manifest[jsEntry].slice(2) : null
    const cssPath = manifest[cssEntry] ? manifest[cssEntry].slice(2) : null
    
    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Settings: ${name}</title>
    ${cssPath ? `<link rel="stylesheet" href="/dist/${name}/${cssPath}">` : ''}
</head>
<body>
    <div id="root"></div>
    ${jsPath ? `<script type="module" src="/dist/${name}/${jsPath}"></script>
    ` : ''}
</body>
</html>`
}

app.use(cors())

// Логирование всех запросов
app.use((req, res, next) => {
    next();
});

// Дополнительное логирование для отладки прокси
app.use((req, res, next) => {
    next();
});

const proxyMiddleware = createProxyMiddleware({
    target: 'http://retail-api.local', // Возвращаемся к домену
    changeOrigin: true,
    secure: false, // Отключаем проверку SSL для локальной разработки
    pathRewrite: {
        '^/api/install': '/install', // Перенаправляем /api/install на /install
        '^/api': '/api' // Остальные /api запросы перенаправляем на /api
    },
    filter: (pathname, req) => {
        // Исключаем наши собственные API endpoints из прокси
        const excludedPaths = [
            '/api/settings',
            '/api/retailcrm',
            '/api/admin',
            '/api/test-proxy'
        ];

        const shouldExclude = excludedPaths.some(path => pathname.startsWith(path));

        if (shouldExclude) {
            return false;
        }

        return true;
    },
    onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('Host', 'retail-api.local'); // Оставляем оригинальный Host для PHP сервера
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    },
    agent: false,
    timeout: 15000,
    proxyTimeout: 15000,
    followRedirects: true,
    selfHandleResponse: false
});

app.use('/api', (req, res, next) => {
    try {
        proxyMiddleware(req, res, next);
    } catch (error) {
        next(error);
    }
});

app.use('/dist', express.static(join(__dirname, '/dist')))

// Тестовый endpoint для проверки прокси
app.get('/api/test-proxy', (req, res) => {
    res.json({
        status: true,
        message: 'Node.js server is working',
        timestamp: new Date().toISOString()
    });
});



app.get('/', (_, response) => {
    response.sendFile(join(__dirname, '/index.html'))
})

app.get('/extension/:uuid', async (request, response) => {
    const uuid = request.params.uuid

    const known = await readManifest(join(__dirname, '/cases.json'))
    const record = known.items.find(r => r.uuid === uuid)

    if (record) {
        const manifest = await readManifest(join(__dirname, `/dist/${record.name}/manifest.json`))
        const html = renderEntrypoint(record.name, manifest, record.script)

        response.send(html)
    } else {
        response.sendStatus(404)
    }
})

app.get('/extension/:uuid/stylesheet', async (request, response) => {
    const uuid = request.params.uuid

    const known = await readManifest(join(__dirname, '/cases.json'))
    const record = known.items.find(r => r.uuid === uuid)

    if (record && record.stylesheet) {
        const manifest = await readManifest(join(__dirname, `/dist/${record.name}/manifest.json`))

        response.sendFile(join(__dirname, 'dist', record.name, manifest[record.stylesheet]))
    } else {
        response.sendStatus(404)
    }
})

// settings routes for marketplace actions
app.get('/settings', async (request, response) => {
    // Render the settings bundle, RetailCRM will open this URL in an iframe as settings tab
    const known = await readManifest(join(__dirname, '/cases.json'))
    const record = known.items.find(r => r.name === 'podpislonRetailcrm')
    if (!record) return response.sendStatus(404)
    
    // Используем settings скрипт вместо основного
    const settingsName = `${record.name}Settings`
    const manifest = await readManifest(join(__dirname, `/dist/${settingsName}/manifest.json`))
    
    const html = renderSettingsPage(settingsName, manifest)
    
    response.send(html)
})

// Тестовый маршрут для отладки настроек
app.get('/settings/test', async (request, response) => {
    // Render the settings bundle, RetailCRM will open this URL in an iframe as settings tab
    const known = await readManifest(join(__dirname, '/cases.json'))
    const record = known.items.find(r => r.name === 'podpislonRetailcrm')
    if (!record) return response.sendStatus(404)
    
    // Используем settings скрипт вместо основного
    const settingsName = `${record.name}Settings`
    const manifest = await readManifest(join(__dirname, `/dist/${settingsName}/manifest.json`))
    
    const html = renderSettingsPage(settingsName, manifest)
    
    response.send(html)
})

// Простой тестовый маршрут без RetailCRM контекста
app.get('/settings/simple', (request, response) => {
    response.send(`<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Простая тестовая страница</title>
</head>
<body>
    <div id="root">
        <h1>Простая тестовая страница</h1>
        <p>Если вы видите этот текст, значит HTML работает.</p>
    </div>
    <script>
        document.getElementById('root').innerHTML = '<h2>JavaScript работает!</h2>';
    </script>
</body>
</html>`)
})

// Тестовая страница с параметрами RetailCRM
app.get('/settings/test-with-params', async (request, response) => {
    const known = await readManifest(join(__dirname, '/cases.json'))
    const record = known.items.find(r => r.name === 'podpislonRetailcrm')
    if (!record) return response.sendStatus(404)
    
    const settingsName = `${record.name}Settings`
    const manifest = await readManifest(join(__dirname, `/dist/${settingsName}/manifest.json`))
    
    const jsPath = manifest[`${settingsName}.js`] ? manifest[`${settingsName}.js`].slice(2) : null
    const cssPath = manifest[`${settingsName}.css`] ? manifest[`${settingsName}.css`].slice(2) : null
    
    // Добавляем тестовые параметры RetailCRM
    const testParams = '?account_id=test-account-123&hash=test-hash-456&user_id=test-user-789&domain=test.retailcrm.ru'
    
    response.send(`<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Тест настроек с параметрами</title>
    ${cssPath ? `<link rel="stylesheet" href="/dist/${settingsName}/${cssPath}">` : ''}
</head>
<body>
    <div id="root">
        <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h2>Загрузка настроек с параметрами...</h2>
            <p>Тестовые параметры: ${testParams}</p>
        </div>
    </div>
    <script>
        // Эмулируем параметры RetailCRM
        const originalUrl = window.location.href;
        const newUrl = originalUrl + '${testParams}';
        window.history.replaceState({}, '', newUrl);
    </script>
    ${jsPath ? `<script type="module" src="/dist/${settingsName}/${jsPath}"></script>` : ''}
</body>
</html>`)
})

// Упрощенная версия настроек без RetailCRM контекста
app.get('/settings/simple-vue', async (request, response) => {
    const known = await readManifest(join(__dirname, '/cases.json'))
    const record = known.items.find(r => r.name === 'podpislonRetailcrm')
    if (!record) return response.sendStatus(404)
    
    const settingsName = `${record.name}Settings`
    const manifest = await readManifest(join(__dirname, `/dist/${settingsName}/manifest.json`))
    
    const jsPath = manifest[`${settingsName}.js`] ? manifest[`${settingsName}.js`].slice(2) : null
    const cssPath = manifest[`${settingsName}.css`] ? manifest[`${settingsName}.css`].slice(2) : null
    
    response.send(`<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Упрощенные настройки</title>
    ${cssPath ? `<link rel="stylesheet" href="/dist/${settingsName}/${cssPath}">` : ''}
</head>
<body>
    <div id="root">
        <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h2>Загрузка упрощенных настроек...</h2>
            <p>Пытаемся загрузить Vue приложение без RetailCRM контекста</p>
        </div>
    </div>
    ${jsPath ? `<script type="module" src="/dist/${settingsName}/${jsPath}"></script>` : ''}
</body>
</html>`)
})

app.post('/settings/save', urlencoded, async (request, response) => {
    const { apiKey, accountId, hash } = request.body
    
    // Валидация входных данных
    if (!apiKey || !accountId) {
        return response.status(400).json({ 
            status: false, 
            error: 'Missing required parameters' 
        })
    }
    
    try {
        await apiKeyStorage.setApiKey(accountId, apiKey)
        
        response.status(200).json({ status: true })
    } catch (error) {
        response.status(500).json({
            status: false, 
            error: 'Internal server error' 
        })
    }
})

// Алиас для совместимости с фронтендом
app.post('/api/settings/save', urlencoded, async (request, response) => {
    const { apiKey, accountId, hash } = request.body
    
    // Валидация входных данных
    if (!apiKey || !accountId) {
        return response.status(400).json({ 
            status: false, 
            error: 'Missing required parameters' 
        })
    }
    
    try {
        await apiKeyStorage.setApiKey(accountId, apiKey)
        
        response.status(200).json({ status: true })
    } catch (error) {
        response.status(500).json({
            status: false, 
            error: 'Internal server error' 
        })
    }
})

app.get('/api/settings/api-key', async (request, response) => {
    const { account_id } = request.query
    
    if (!account_id) {
        return response.status(400).json({ 
            error: 'Missing account_id parameter' 
        })
    }
    
    try {
        const apiKey = await apiKeyStorage.getApiKey(account_id)
        const retailcrmApiKey = await apiKeyStorage.getRetailcrmApiKey(account_id)
        
        response.status(200).json({ apiKey, retailcrmApiKey })
    } catch (error) {
        response.status(500).json({
            error: 'Internal server error' 
        })
    }
})

// Дополнительные API для управления ключами
app.delete('/api/settings/api-key', async (request, response) => {
    const { account_id } = request.query
    
    if (!account_id) {
        return response.status(400).json({ 
            error: 'Missing account_id parameter' 
        })
    }
    
    try {
        const deleted = await apiKeyStorage.deleteApiKey(account_id)
        
        if (deleted) {
            response.status(200).json({ status: true, message: 'API key deleted' })
        } else {
            response.status(404).json({ status: false, error: 'API key not found' })
        }
    } catch (error) {
        response.status(500).json({
            error: 'Internal server error' 
        })
    }
})

// Административный эндпоинт для просмотра всех ключей (только для разработки)
app.get('/api/admin/keys', async (request, response) => {
    try {
        const keys = await apiKeyStorage.getAllKeys()
        response.status(200).json({ 
            keys,
            count: Object.keys(keys).length 
        })
    } catch (error) {
        response.status(500).json({
            error: 'Internal server error' 
        })
    }
})

// Endpoint для сохранения API ключей (новый формат с двумя ключами)
app.post('/api-keys/save', urlencoded, async (request, response) => {
    const { account_id, api_key, retailcrm_api_key } = request.body
    
    // Валидация входных данных
    if (!account_id || !api_key) {
        return response.status(400).json({ 
            status: false, 
            error: 'Missing required parameters: account_id, api_key' 
        })
    }
    
    try {
        await apiKeyStorage.setApiKey(account_id, api_key, retailcrm_api_key || null)
        
        response.status(200).json({ status: true })
    } catch (error) {
        response.status(500).json({
            status: false, 
            error: 'Internal server error' 
        })
    }
})

// Маршрут для получения параметров RetailCRM при активации модуля
app.post('/api/retailcrm/activate', async (request, response) => {
    try {
        const { clientId, apiKey, domain } = request.body;

        if (!clientId || !apiKey || !domain) {
            return response.status(400).json({
                status: false,
                error: 'Missing required parameters: clientId, apiKey, domain'
            });
        }
        
        // Сохраняем данные активации для последующего использования
        const activationData = {
            clientId,
            apiKey,
            domain,
            activatedAt: new Date().toISOString()
        };
        
        // В реальной реализации здесь нужно сохранить данные в базу данных
        // Пока сохраняем в файл для демонстрации
        try {
            const fs = await import('fs/promises');
            await fs.writeFile('retailcrm_activation.json', JSON.stringify(activationData, null, 2));
        } catch (error) {
            console.log('Failed to save activation data:', error);
        }
        
        response.status(200).json({
            status: true,
            message: 'Module activated successfully',
            clientId,
            domain
        });
        
    } catch (error) {
        response.status(500).json({
            status: false,
            error: 'Internal server error'
        });
    }
});

// Маршрут для получения параметров RetailCRM
app.get('/api/retailcrm/params', async (request, response) => {
    try {
        const { account_id, user_id, domain, clientId, retailcrm_domain } = request.query;
        
        if (clientId) {

            try {
                // Читаем данные активации
                const fs = await import('fs/promises');
                const activationData = JSON.parse(await fs.readFile('retailcrm_activation.json', 'utf-8'));
                
                if (activationData.clientId === clientId) {
                    const accountResponse = await fetch(`${activationData.domain}/api/v5/account`, {
                        headers: {
                            'X-API-KEY': activationData.apiKey
                        }
                    });
                    
                    if (accountResponse.ok) {
                        const accountData = await accountResponse.json();

                        const accountInfo = accountData.success ? accountData.account : null;
                        
                        response.status(200).json({
                            status: true,
                            account_id: accountInfo?.code || clientId,
                            user_id: user_id || 'default-user',
                            domain: activationData.domain,
                            clientId: clientId,
                            account_name: accountInfo?.name || 'unknown'
                        });
                        return;
                    }
                }
            } catch (error) {
                console.log('Failed to get activation data:', error);
            }
        }
        
        if (retailcrm_domain) {
            try {
                // Извлекаем account_id из домена
                const domainParts = retailcrm_domain.replace('https://', '').replace('http://', '').split('.');
                const extractedAccountId = domainParts.length > 0 ? domainParts[0] : 'unknown';
                
                response.status(200).json({
                    status: true,
                    account_id: extractedAccountId,
                    user_id: user_id || 'default-user',
                    domain: retailcrm_domain,
                    clientId: clientId || null,
                    account_name: extractedAccountId,
                    note: 'Using real RetailCRM domain data'
                });
                return;
            } catch (error) {
                console.log('Failed to extract account_id from domain:', error);
            }
        }
        
        // Если параметры переданы напрямую
        if (account_id && user_id) {
            response.status(200).json({
                status: true,
                account_id,
                user_id,
                domain: domain || request.headers.host
            });
        } else {
            // Если параметры не переданы, возвращаем тестовые значения для разработки
            response.status(200).json({
                status: true,
                account_id: 'dev-account-123',
                user_id: 'dev-user-456',
                domain: domain || request.headers.host,
                note: 'Using development values - in production, RetailCRM should pass clientId or retailcrm_domain'
            });
        }
    } catch (error) {
        response.status(500).json({
            status: false,
            error: 'Internal server error'
        });
    }
});

// Маршрут для получения параметров через RetailCRM API v5
app.get('/api/retailcrm/user-info', async (request, response) => {
    try {
        const { retailcrm_api_key, retailcrm_domain } = request.query;
        
        if (!retailcrm_api_key || !retailcrm_domain) {
            return response.status(400).json({
                status: false,
                error: 'Missing retailcrm_api_key or retailcrm_domain'
            });
        }
        
        // Получаем информацию об аккаунте
        const accountResponse = await fetch(`${retailcrm_domain}/api/v5/account`, {
            headers: {
                'X-API-KEY': retailcrm_api_key
            }
        });
        
        if (!accountResponse.ok) {
            throw new Error(`RetailCRM API error: ${accountResponse.status}`);
        }
        
        const accountData = await accountResponse.json();
        const usersResponse = await fetch(`${retailcrm_domain}/api/v5/users`, {
            headers: {
                'X-API-KEY': retailcrm_api_key
            }
        });
        
        if (!usersResponse.ok) {
            throw new Error(`RetailCRM API error: ${usersResponse.status}`);
        }
        
        const usersData = await usersResponse.json();
        const accountInfo = accountData.success ? accountData.account : null;
        const currentUser = usersData.success && usersData.users.length > 0 ? usersData.users[0] : null;
        
        response.status(200).json({
            status: true,
            account_id: accountInfo?.code || 'unknown',
            user_id: currentUser?.id?.toString() || 'unknown',
            domain: retailcrm_domain,
            account_name: accountInfo?.name || 'unknown',
            user_name: currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'unknown'
        });
        
    } catch (error) {
        response.status(500).json({
            status: false,
            error: error.message || 'Internal server error'
        });
    }
});

// fiscalReceipts routes

app.post('/receipts-count', async (request, response) => {
    response.status(200).json({ count: 2 })
})

const receipts = [{
    id: 645,
    details: {
        receiptTime: '2024-11-17T11:51:00+03:00',
        shiftNumber: 16,
        machineNumber: 'KZN030315',
        taxSystem: 'OSN',
        onlinePayment: true,
        fnNumber: '7380440801381848',
        kktRegistrationNumber: '0007642722037997',
        fdNumber: 41859,
        fpd: 2975038937,
        ffdVersion: '1.2',
    },
}, {
    id: 813,
    details: {
        receiptTime: '2024-10-28T10:32:00+03:00',
        shiftNumber: 18,
        machineNumber: 'KZN1001202',
        taxSystem: 'OSN',
        onlinePayment: true,
        fnNumber: '7380440800998420',
        kktRegistrationNumber: '0007642686026725',
        fdNumber: 4696,
        fpd: 3632111203,
        ffdVersion: '1.2',
    },
}]

app.post('/receipts', urlencoded, async (request, response) => {
    const payload = JSON.parse(request.body.payload)
    const responseReceipts = receipts.map(receipt => {
        return {
            ...receipt,
            id: `ORDER${payload.order_number}_${receipt.id}`,
        }
    })
    response.status(200).json({ receipts: responseReceipts })
})

// orderNotes routes
const avatar = 'https://on-desktop.com/wps/Animals___Cats_Red_Cat_with_open_mouth_044663_.jpg'

const notes = [{
    id: 1,
    author: {
        id: 1, // Этот ID не настоящий и используется только для демонстрации
        name: 'Василий Петров',
        avatar,
    },
    date: '2024-10-15T16:00:00',
    text: 'Клиент просил оставить заказ у двери',
}, {
    id: 2,
    author: {
        id: 2, // Этот ID не настоящий и используется только для демонстрации
        name: 'Николай Понкратов',
        avatar,
    },
    avatar: '',
    date: '2024-10-12T00:00:00',
    text: 'Просил оповестить, как появятся мандарины, хочет добавить к заказу',
}]

app.post('/notes-count', async (request, response) => {
    response.status(200).json({ count: notes.length })
})

app.post('/notes', async (request, response) => {
    response.status(200).json({ notes })
})

app.post('/notes/new', urlencoded, async (request, response) => {
    const payload = JSON.parse(request.body.payload)

    response.status(200).json({ notes: [payload.note, ...notes] })
})

// customerINN routes

app.post('/customer/by-inn', urlencoded, async (request, response) => {
    const { inn } = JSON.parse(request.body.payload)

    if (inn === '1234567890') {
        return response.status(200).json({
            data: {
                name: 'МФО ТомскАсбоцементПивБанк',
                bank: 'Сбербанк России, ОАО, г. Москва',
                bankAccount: '415219379646',
                bankAddress: '877568, Липецкая область, город Клин, наб. Косиора, 61',
                legalName: 'ОАО Глав',
                legalAddress: '877568, Липецкая область, город Клин, наб. Косиора, 61',
                corrAccount: '601630812474',
                OGRN: '1027700132195',
                OGRNIP: '304770000000571',
                INN: '2872865074',
                OKPO: '10720877',
                BIK: '38630490',
                KPP: '287201001',
                certificate: {
                    date: '15.03.2020',
                    number: '78-20-567890',
                },
            },
        })
    }

    response.status(400)
})

app.post('/promos', async (request, response) => {
    response.status(200).json({
        promos: [{
            code: 'gift',
            name: 'Подарок',
            description: 'Доступен товар в подарок',
        }, {
            code: 'discount',
            name: 'Скидка 5% при оплате СБП',
            description: 'Применяется скидка 5% при оплате СБП',
        }, {
            code: 'third',
            name: 'Третий товар в подарок',
            description: 'При покупке двух товаров третий в подарок.',
        }],
    })
})

app.post('/offers', async (request, response) => {
    if (!process.env.CRM_API_KEY) {
        response.status(500).json({ errors: ['CRM_API_KEY is not defined'] })
        return
    }

    try {
        response.status(200).json(await (
            await fetch(process.env.CRM_API_HOST + '/api/v5/store/offers?filter[active]=1', {
                headers: { 'X-API-KEY': process.env.CRM_API_KEY },
            })
        ).json())
    } catch (e) {
        response.status(500).json({ errors: [String(e)] })
    }
})

const server = app.listen(3000, () => {
    console.log('Serving on port 3000')
})

process.on('SIGINT', () => {
    server.close(() => {
        console.log('Server has been stopped')
        process.exit(0)
    })
})
