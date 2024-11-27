import fs from 'fs';
import path from 'path';
import axios from 'axios';


export interface config {
    SLACK_BOT_TOKEN: string,
    SLACK_ALERT_CHANNEL: string,
    CORALOGIX_API_URL: string,
    CORALOGIX_URL: string
    CORALOGIX_BEARER_TOKEN: string,
    KARATE_REPORTS_BASE_URL?: string
}
export const QUERY_TEMPLATE = `source logs
| filter ($d.request_id ~ '{requestId}' || $d.context.RequestID ~ '{requestId}')
| filter $d.level ~ 'error'
| filter $d.message != null
| groupby $m.logid, $m.ingressTimestamp, $d.resource.attributes.k8s_container_name, $d.message:string`;

export async function sendToSlack(message: string, config: config, threadId: string | null = null) {
    const channelId = config.SLACK_ALERT_CHANNEL;
    if (!channelId) {
        console.error(`No channel ID configured for service`);
        return;
    }

    try {
        const payload = {
            channel: channelId,
            text: message,
            ...(threadId && { thread_ts: threadId })
        };

        const response = await axios.post('https://slack.com/api/chat.postMessage', payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.SLACK_BOT_TOKEN}`
            }
        });

        if (!response.data.ok) {
            console.log(response)
            console.error(`Failed to send message to slack channel:`, response.data.error);
            throw new Error(response.data.error);
        }

        return response.data;
    } catch (error) {
        console.error(`Error sending message to slack channel:`, error);
        throw new Error('Failed to send message to Slack');
    }
}

export const getLogsFromCoralogix = async (requestId: string, config: config) => {
    const query = QUERY_TEMPLATE.replaceAll('{requestId}', requestId);
    const currentDate = new Date();
    const endDate = currentDate.toISOString();
    const startDate = new Date(currentDate.getTime() - 23 * 60 * 60 * 1000).toISOString();
    const params = {
        query: query,
        metadata: {
            tier: "TIER_ARCHIVE",
            syntax: "QUERY_SYNTAX_DATAPRIME",
            startDate: startDate,
            endDate: endDate,
            limit: 100,
        }
    };
    const headers = {
        'Authorization': `Bearer ${config.CORALOGIX_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
    };

    try {
        const response = await axios.post(config.CORALOGIX_API_URL, params, { headers });
        return response.data;
    } catch (error) {
        console.error(`Error fetching logs for requestId ${requestId}:`, error);
        return null;
    }
};
export function loadProperties(filePath: string): config {
    const properties: config = {
        SLACK_BOT_TOKEN: '',
        SLACK_ALERT_CHANNEL: '',
        CORALOGIX_URL: '',
        CORALOGIX_API_URL: '',
        CORALOGIX_BEARER_TOKEN: '',
        KARATE_REPORTS_BASE_URL: ''
    };

    // Read the properties file
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Parse each line
    fileContent.split('\n').forEach(line => {
        // Ignore empty lines and comments
        if (line && !line.startsWith('#')) {
            const [key, value] = line.split('=');
            if (key && value) {
                properties[key.trim()] = value.trim();
            }
        }
    });
    return properties;
}
