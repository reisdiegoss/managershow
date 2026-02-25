import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class LogisticsTimeline extends Model {
    static table = 'logistics_timeline'

    @field('show_id') showId!: string
    @field('time') time!: string
    @field('title') title!: string
    @field('description') description?: string
    @field('icon_type') iconType?: string
    @field('order') order!: number

    @field('weather_temp') weatherTemp?: number
    @field('weather_condition') weatherCondition?: string
    @field('route_distance') routeDistance?: string
    @field('route_duration') routeDuration?: string
    @field('location_place_id') locationPlaceId?: string

    @readonly @date('created_at') createdAt!: Date
    @readonly @date('updated_at') updatedAt!: Date
}
