import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Show extends Model {
    static table = 'shows'

    @field('tenant_id') tenantId!: string
    @field('artist_id') artistId!: string
    @field('status') status!: string
    @field('client_type') clientType!: string
    @field('negotiation_type') negotiationType!: string
    @field('date_show') dateShow!: string
    @field('location_city') locationCity!: string
    @field('location_uf') locationUf!: string
    @field('base_price') basePrice!: number
    @field('total_price') totalPrice!: number
    @field('description') description?: string

    @readonly @date('created_at') createdAt!: Date
    @readonly @date('updated_at') updatedAt!: Date
}
