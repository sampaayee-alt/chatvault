import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface ChatSessionInput {
    title: string;
    sourceUrl: string;
    parsedChatJson: string;
}
export interface ChatSession {
    id: bigint;
    title: string;
    sourceUrl: string;
    timestamp: Time;
    parsedChatJson: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface backendInterface {
    fetchUrlContent(url: string): Promise<string>;
    getChatSession(id: bigint): Promise<ChatSession>;
    getTotalExports(): Promise<bigint>;
    listChatSessions(): Promise<Array<ChatSession>>;
    saveChatSession(input: ChatSessionInput): Promise<bigint>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
