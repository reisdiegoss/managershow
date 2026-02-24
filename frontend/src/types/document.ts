export type DocumentEntityType = 'SHOW' | 'ARTIST' | 'CONTRACTOR';

export interface DocumentTemplate {
    id: string;
    tenant_id: string;
    name: string;
    entity_type: DocumentEntityType;
    content_html: string;
    created_at: string;
    updated_at: string;
}

export interface DocumentTemplateCreate {
    name: string;
    entity_type: DocumentEntityType;
    content_html: string;
}

export interface DocumentGenerateRequest {
    entity_id: string;
    custom_variables: Record<string, string>;
}
