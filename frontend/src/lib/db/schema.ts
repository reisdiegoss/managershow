import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
    version: 1,
    tables: [
        tableSchema({
            name: 'shows',
            columns: [
                { name: 'tenant_id', type: 'string' },
                { name: 'artist_id', type: 'string' },
                { name: 'status', type: 'string' },
                { name: 'client_type', type: 'string' },
                { name: 'negotiation_type', type: 'string' },
                { name: 'date_show', type: 'string' },
                { name: 'location_city', type: 'string' },
                { name: 'location_uf', type: 'string' },
                { name: 'base_price', type: 'number' },
                { name: 'total_price', type: 'number' },
                { name: 'description', type: 'string', isOptional: true },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ],
        }),
        tableSchema({
            name: 'logistics_timeline',
            columns: [
                { name: 'show_id', type: 'string', isIndexed: true },
                { name: 'time', type: 'string' },
                { name: 'title', type: 'string' },
                { name: 'description', type: 'string', isOptional: true },
                { name: 'icon_type', type: 'string', isOptional: true },
                { name: 'order', type: 'number' },
                { name: 'weather_temp', type: 'number', isOptional: true },
                { name: 'weather_condition', type: 'string', isOptional: true },
                { name: 'route_distance', type: 'string', isOptional: true },
                { name: 'route_duration', type: 'string', isOptional: true },
                { name: 'location_place_id', type: 'string', isOptional: true },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ],
        }),
        tableSchema({
            name: 'show_checkins',
            columns: [
                { name: 'show_id', type: 'string', isIndexed: true },
                { name: 'user_id', type: 'string', isIndexed: true },
                { name: 'checked_in_at', type: 'number' },
                { name: 'dynamic_data', type: 'string' }, // JSON stringified
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ],
        }),
        tableSchema({
            name: 'financial_transactions',
            columns: [
                { name: 'show_id', type: 'string', isIndexed: true },
                { name: 'category', type: 'string' },
                { name: 'description', type: 'string' },
                { name: 'amount', type: 'number' },
                { name: 'transaction_date', type: 'string' },
                { name: 'receipt_url', type: 'string', isOptional: true },
                { name: 'is_auto_generated', type: 'boolean' },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ],
        }),
    ],
})
