import fs from 'fs';
import path from 'path';
import { getLogsFromCoralogix, loadProperties, QUERY_TEMPLATE, sendToSlack } from '../utils/helpers';
async function readJsonFilesFromDirectory(directoryPath: string): Promise<any[]> {
    try {
        let parsedResponses: any[] = [];

        const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(directoryPath, entry.name);

            if (entry.isDirectory()) {
                // Recursively process subdirectory
                const subdirectoryResponses = await readJsonFilesFromDirectory(fullPath);
                parsedResponses = parsedResponses.concat(subdirectoryResponses);
            } else if (entry.isFile() && entry.name.endsWith('.json')) {
                // Process JSON file
                try {
                    const fileContent = await fs.promises.readFile(fullPath, 'utf8');
                    const jsonData = JSON.parse(fileContent);
                    parsedResponses.push(jsonData);
                    console.log(`Content of file ${fullPath}:`, JSON.stringify(jsonData, null, 2));
                } catch (parseError) {
                    console.error(`Error parsing JSON from file ${fullPath}:`, parseError);
                    throw parseError;
                }
            }
        }
        return parsedResponses;
    } catch (error) {
        console.error("Error reading JSON files:", error);
        throw error;
    }
}
export enum ErrorTypes {
    BACKEND_ERROR = "BACKEND_ERROR",
    CLIENT_ERROR = "CLIENT_ERROR",
    TASK_FAILURE = "TASK_FAILURE",
    WAIT_TIMEOUT = "WAIT_TIMEOUT",
    UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
}
const errorPatterns: { [key: string]: ErrorTypes } = {
    "\\b500\\b": ErrorTypes.BACKEND_ERROR,
    "\\b502\\b": ErrorTypes.BACKEND_ERROR,
    "\\b503\\b": ErrorTypes.BACKEND_ERROR,
    "\\b400\\b": ErrorTypes.CLIENT_ERROR,
    "\\b401\\b": ErrorTypes.BACKEND_ERROR,
    "\\b403\\b": ErrorTypes.BACKEND_ERROR,
    "\\b404\\b": ErrorTypes.BACKEND_ERROR,
    "\\b409\\b": ErrorTypes.BACKEND_ERROR,
    "expected.*to not exist": ErrorTypes.BACKEND_ERROR,
    "PRE-PROCESSING CHECK ON": ErrorTypes.BACKEND_ERROR,
    "cy\\.task\\('gmail:check-inbox'\\)": ErrorTypes.TASK_FAILURE,
    "^CypressError: Timed out retrying after \\d+ms: `cy\\.wait\\(\\)` timed out waiting `\\d+ms` for the 1st request to the route: `gql[A-Za-z]+Query`. No request ever occurred\\.(\\n\\n.+)*$":
        ErrorTypes.CLIENT_ERROR,
}
function createMessage(
    env: string,
    testType: string,
    cypressCloudRunNumber: string | undefined,
    cypressCloudProjectId: string | undefined,
    serviceName: string,
    failure: any,
    startDate: number,
    endDate: number,
    config: any,
    noLogs: boolean = false,
    clientError: boolean = false
) {
    let cleanedErrorMessage = failure.errorMessage.replace(/\n/g, ' ').replace(/\r/g, ' ');
    if (clientError) {
        return `:cypress: 🚨 *Cypress ${testType} Test Failure in ${env}, and error from client*\n` +
            `*Test Case*: ${failure.title}\n` +
            `*Feature File Name*: ${failure.filename}\n` +
            `*Request ID*: \`${failure.uuid}\`\n` +
            `*ErrorMesssage*: ${cleanedErrorMessage}\n` +
            `*Report Link*: https://cloud.cypress.io/projects/${cypressCloudProjectId}/runs/${cypressCloudRunNumber}/specs`;
    }
    let baseMessage = `:cypress: 🚨 *Cypress ${testType} Test Failure in ${env}* & Service throwing the error ${serviceName}\n\n` +
        `*Test Case*: ${failure.title}\n` +
        `*Feature File Name*: ${failure.filename}\n` +
        `*Request ID*: \`${failure.uuid}\`\n` +
        `*ErrorMesssage*: ${cleanedErrorMessage}\n` +
        `*Report Link*: https://cloud.cypress.io/projects/${cypressCloudProjectId}/runs/${cypressCloudRunNumber}/specs \n`;
    if (!noLogs) {
        baseMessage += `*Coralogix Link*: [Logs Here](${config.CORALOGIX_URL}?permalink=true&startTime=${startDate}&endTime=${endDate}&logId=${failure.logId})`;
    }
    if (noLogs) {
        return baseMessage + `*logs*: No logs found for this request.`;
    }
    return baseMessage;
}
async function sendFailureMessagesToSlack(failures: any[], config: any, env: string, testType: string, cypressCloudRunNumber: string, cypressCouldProjectId: string, serviceName: string, startDate: number, endDate: number, isNoLogs: boolean = false, clientError: boolean = false) {
    console.log("notify errror called")
    console.log(failures.length)
    if (failures.length === 0) return;
    const firstFailure = failures[0];
    console.log("notify errror called again")
    const mainMessage = createMessage(env, testType, cypressCloudRunNumber, cypressCouldProjectId, serviceName, firstFailure, startDate, endDate, config, isNoLogs, clientError);
    console.log("mainMessage", mainMessage)
    const response = await sendToSlack(mainMessage,config);
    const threadId = response.ts; 
    for (let i = 1; i < failures.length; i++) {
        const failure = failures[i];
        const threadedMessage = createMessage(env, testType, cypressCloudRunNumber, serviceName, failure, startDate, endDate, config, isNoLogs, clientError);
        console.log("threadedMessage", threadedMessage)
        await sendToSlack(threadedMessage, threadId);  
    }
}
async function notifyErrors(errorMap: { [key: string]: any[] }, noLogsBucket: any[], clientErrors: any[], config: any, env: string, testType: string, cypressCloudRunNumber: string, cypressCouldProjectId: string) {
    const currentDate = new Date();
    const endDate = currentDate.getTime();
    const startDate = new Date(currentDate.getTime() - 1 * 60 * 60 * 1000).getTime();
    for (const [serviceName, failures] of Object.entries(errorMap)) {
        await sendFailureMessagesToSlack(failures, config, env, testType, cypressCloudRunNumber, cypressCouldProjectId, serviceName, startDate, endDate);
    }
    if (noLogsBucket && noLogsBucket.length > 0) {
        await sendFailureMessagesToSlack(noLogsBucket, config, env, testType, cypressCloudRunNumber, cypressCouldProjectId, '', startDate, endDate, true);
    }
    if (clientErrors && clientErrors.length > 0) {
        await sendFailureMessagesToSlack(clientErrors, config, env, testType, cypressCloudRunNumber, cypressCouldProjectId, '', startDate, endDate, null, true);
    }
}
async function captureFirstFailures(results: any[]): Promise<{ filename: string, title: string, uuid: string, errorMessage: string }[]> {
    const seenRequestIds = new Set();
    const failureDetails: {
        filename: string;
        title: string;
        uuid: string;
        errorMessage: string;
    }[] = [];
    // Process each spec file
    for (const result of results) {
        let specFileName: any;
        for (const resultItem of result.results) {
            specFileName = resultItem.file;
            for (const suite of resultItem.suites) {
                for (const nestedSuite of suite.suites) {
                    for (const test of nestedSuite.tests) {
                        if (test.state === 'failed' && !seenRequestIds.has(specFileName)) {
                            failureDetails.push({
                                filename: specFileName,
                                title: test.title,
                                uuid: test.uuid,
                                errorMessage: test.err
                                    ? test.err.message
                                    : "No error message provided",
                            });
                            seenRequestIds.add(specFileName); //Only 1 failed test details are captured per spec file
                            break;
                        }
                    }
                }
            }
        }
    }
    return failureDetails;
}
function categorizeFailures(
    firstFailures: { filename: string; title: string; uuid: string; errorMessage: string }[],
    errorPatterns: { [key: string]: string }
): { filename: string; title: string; uuid: string; errorMessage: string; errorType: string }[] {
    return firstFailures.map(failure => {
        const category = Object.keys(errorPatterns).find(pattern =>
            new RegExp(pattern).test(failure.errorMessage)
        );
        return {
            ...failure, // Spread the `failure` object to include its original properties
            errorType: category ? errorPatterns[category] : "UNEXPECTED_ERROR",
        };
    });
}
async function processFailures(results): Promise<{ filename: string, title: string, uuid: string, errorMessage: string, errorType: string }[]> {
    const failures = await captureFirstFailures(results);
    const categorizedFailures = categorizeFailures(failures, errorPatterns);
    return categorizedFailures;
}
async function processFailuresFromLogs(categorizedFailures: any[], config: any) {
    const errorMap: { [key: string]: any[] } = {};
    const noLogsBucket: any[] = [];
    const clientErrorsBucket: any[] = [];
    for (const failure of categorizedFailures) {
        if (failure.errorType === ErrorTypes.CLIENT_ERROR) {
            clientErrorsBucket.push(failure);
            continue;
        }
        try {
            const logsData = await getLogsFromCoralogix(failure.uuid, config);
            const hasOnlyQueryId = logsData && Object.keys(logsData).length === 1 && logsData.queryId && logsData.queryId.queryId;

            if (!hasOnlyQueryId) {
                const logArray = logsData.split('\n').filter(Boolean); // Split the logs into an array and filter empty lines
                let parsedLogs = null;
                for (const log of logArray) {
                    try {
                        const parsedLog = JSON.parse(log);
                        if (parsedLog.result) {
                            parsedLogs = parsedLog.result;
                            break;
                        }
                    } catch (err) {
                        console.warn('Error parsing log:', err);
                    }
                }
                if (parsedLogs?.results?.length > 0) {
                    let firstValidLogFound = false;
                    let onlyPolicyAgentErrors = true;

                    for (const log of parsedLogs.results) {
                        try {
                            const userData = JSON.parse(log.userData);
                            const serviceName = userData.resource.attributes.k8s_container_name;
                            const coralogixErrorMessage = userData._expr0;
                            const logId = userData.logid;
                            if (serviceName === 'policy-agent' && coralogixErrorMessage.includes('EnforceOnEvent')) {
                                continue;
                            } else {
                                onlyPolicyAgentErrors = false;
                                if (!firstValidLogFound) {
                                    if (!errorMap[serviceName]) {
                                        errorMap[serviceName] = [];
                                    }
                                    errorMap[serviceName].push({
                                        ...failure,
                                        service: serviceName,
                                        coralogixErrorMessage: coralogixErrorMessage,
                                        logId: logId
                                    });

                                    firstValidLogFound = true;
                                }
                            }
                        } catch (err) {
                            console.warn("Error processing log:", err);
                        }
                    }
                    if (onlyPolicyAgentErrors) {
                        clientErrorsBucket.push({
                            ...failure,
                            service: "policy-agent",
                            error: "Only EnforceOnEvent errors found",
                        });
                    }
                } else {
                    noLogsBucket.push({
                        ...failure,
                        service: "No valid logs available",
                    });
                }
            } else {
                noLogsBucket.push({
                    ...failure,
                    service: "Error fetching logs",
                });
            }
        } catch (error) {
            console.error(`Error fetching logs for failure ${failure.uuid}:`, error);
            noLogsBucket.push({
                failure,
                service: "Error during log processing",
            });
        }
    }
    return { errorMap, noLogsBucket, clientErrorsBucket };
}

async function main() {
    try {
       const resultDirectoryPath = process.argv[2]; // Path to the downloaded artifacts
                if (!fs.existsSync(resultDirectoryPath)) {
            throw new Error(`Directory path does not exist: ${resultDirectoryPath}`);
        }
        const env = process.argv[7];  // Environment name 
        const testType = process.argv[3];  // Test type 
        const cypressCloudRunNumber = process.argv[4];  // Cypress run number
        const cypressCloudProjectId = process.argv[5]; // cypress cloud project id
        const jsonFiles = await readJsonFilesFromDirectory(resultDirectoryPath);
        const configPath = path.resolve(__dirname, "../../aws-config.properties");
        const directoryPath = path.join(__dirname, `../../cypress/reports/mocha/${testType}`);
         const config = loadProperties(configPath);
        console.log("config", config)
        const categorizedFailures = await processFailures(jsonFiles);
       
        const { errorMap, noLogsBucket, clientErrorsBucket } = await processFailuresFromLogs(categorizedFailures, config);
        console.log(errorMap, noLogsBucket, clientErrorsBucket)
        await notifyErrors(errorMap, noLogsBucket, clientErrorsBucket, config, env, testType, cypressCloudRunNumber, cypressCloudProjectId)
    } catch (error) {
        console.error("Error in main process:", error);
    }
}
main().catch((err) => {
    console.error("Error in processing roles:", err)
})
